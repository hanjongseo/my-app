// 14주차 · 5번째 취약점(Rate Limiting 부재) 방어.
//
// 지금까지 로그인 폼(app/login, lib/actions.ts의 loginAction)은 시도 횟수에
// 아무 제한이 없었습니다 — 같은 이메일로 비밀번호를 수백 번 틀려도 서버는
// 매번 성실하게 DB를 조회하고 bcrypt.compare를 돌려줬습니다. 이것이
// 무차별 대입 공격(Brute-force Attack)과 크리덴셜 스터핑(Credential
// Stuffing, 다른 사이트에서 유출된 이메일/비밀번호 조합을 대량으로
// 시도하는 공격)이 성립하는 이유입니다.
//
// 여기서는 가장 단순한 형태 — 메모리 안에 "누가 최근에 몇 번
// 시도했는지"를 세는 고정 윈도우(Fixed Window) 카운터 — 로 막습니다.
// 프로덕션 수준의 알고리즘(sliding window, token bucket 등)이나 분산
// 환경 대응은 일부러 범위 밖으로 뒀습니다 — 아래 "한계" 주석 참고.
type Bucket = { count: number; windowStart: number }

const WINDOW_MS = 60_000 // 1분
const MAX_ATTEMPTS = 5 // 1분에 5번까지만 허용

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

// identifier로는 이메일을 씁니다 — "이 계정을 노린 무차별 대입"을 막는
// 것이 목표이기 때문입니다. IP 기준으로도 동시에 제한하고 싶다면
// `checkLoginRateLimit(`${ip}:${email}`)`처럼 키를 조합하면 됩니다.
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const key = identifier.trim().toLowerCase() || "unknown"
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    // 새 윈도우 시작 (처음 시도했거나, 이전 윈도우가 이미 끝났거나)
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterSeconds: 0 }
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000),
    )
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  bucket.count += 1
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - bucket.count,
    retryAfterSeconds: 0,
  }
}

// ⚠️ [14주차 · 한계, 수업용으로 알아둘 것]
// 이 구현은 프로세스 하나의 메모리(Map)에만 상태를 저장합니다. 즉:
//   1) 서버를 여러 인스턴스로 띄우면(로드밸런서 뒤 다중 서버, 서버리스
//      Edge 함수 등) 인스턴스마다 카운터가 따로 놀아서 제한이 새어나갑니다.
//   2) 서버가 재시작되면(배포, 크래시) 카운터가 초기화됩니다.
// 실무에서는 Redis 같은 공유 저장소(예: Upstash Redis + @upstash/ratelimit)
// 나 API Gateway/CDN 레벨의 Rate Limiting(예: Vercel, Cloudflare)을 함께
// 씁니다. 이번 수업은 "왜 필요한지, 어떤 모양인지"를 코드로 직접 만들어
// 보는 것이 목적이므로 단일 인스턴스 가정의 in-memory 구현으로 충분합니다.
