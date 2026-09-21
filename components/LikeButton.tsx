"use client"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { likeProductAction } from "@/lib/actions"
import { useState } from "react"
export function LikeButton({
  id,
  initialLikes,
}: {
  id: string
  initialLikes: number
}) {
  const [likes, setLikes] = useState(initialLikes)
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending} //좋아요 저장중에 좋아요 추가로 안눌림
      size="lg"
      onClick={() => {
        startTransition(async () => {
          const newLikes = await likeProductAction(id)
          setLikes(newLikes)
        })
      }}
    >
      {isPending ? "저장 중..." : `좋아요 ${likes}`}
    </Button>
  )
}
