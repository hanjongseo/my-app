import type { NextConfig } from "next"

// ✅ [14주차 · 신규] 5종 취약점의 마지막 항목 — 보안 헤더(Security
// Headers). 응답에 이 헤더들이 없다고 해서 그 자체로 취약점이 되는 건
// 아니지만, 브라우저가 우리 대신 여러 종류의 공격(클릭재킹, MIME 스니핑을
// 이용한 XSS, 과도한 리퍼러 정보 유출 등)을 막아주도록 켜는 스위치입니다.
// "코드에 버그가 없어도 헤더 설정만으로 막을 수 있는 공격"이 있다는 것이
// 이번 주 핵심 포인트입니다.
//
// 여기서는 dev 서버(HMR, eval 기반 소스맵)를 깨뜨리지 않는 범위의
// 안전한 기본값만 켭니다. Content-Security-Policy는 라이브러리마다
// 필요한 예외가 많아 실제 프로젝트마다 별도로 튜닝해야 하므로, 이번
// 예제에서는 일부러 범위 밖으로 뒀습니다(슬라이드에서 개념만 소개).
const securityHeaders = [
  {
    // 브라우저가 응답의 Content-Type을 무시하고 "이건 사실 HTML/JS인 것
    // 같은데?"라며 제멋대로 해석(MIME 스니핑)하지 못하게 막습니다.
    // 예: 이미지로 업로드된 파일을 스크립트로 오인해 실행하는 것을 방지.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // 우리 페이지를 다른 사이트의 <iframe> 안에 몰래 넣어 클릭을
    // 유도하는 클릭재킹(Clickjacking)을 막습니다.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // 다른 사이트로 이동할 때 우리 쪽 URL(쿼리스트링 등 민감할 수 있는
    // 정보 포함)을 얼마나 넘겨줄지 제한합니다.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // 이 사이트에서 카메라·마이크·위치 정보 등 민감한 브라우저 기능을
    // 아예 쓰지 않는다고 명시적으로 선언합니다 — 서드파티 스크립트가
    // 몰래 요청하는 것도 함께 막힙니다.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
