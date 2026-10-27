"use server"

import { likeProduct as likeProductInDb } from "@/lib/products"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotice, deleteNotice, getNotice } from "@/lib/notices"
import { createUser } from "@/lib/users"
import { auth, signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function likeProductAction(id: string) {
  const newLikes = await likeProductInDb(id)
  revalidatePath("/products${id}")
  return newLikes
}

export async function createNoticeAction(formData: FormData) {
  const session = await auth()
  console.log(session)
  if (!session?.user) {
    redirect("/login")
  }
  const title = String(formData.get("title") ?? "").trim()
  //  const author = String(formData.get("author") ?? "").trim()
  const content = String(formData.get("content") ?? "").trim()

  if (!title || !content) {
    throw new Error("제목, 내용을 모두 입력해주세요.")
  }
  const notice = await createNotice({
    title,
    content,
    authorId: session.user.id,
    authorName: session.user.name ?? "이름 없음",
  })
  revalidatePath("/notices")
  redirect(`/notices/${notice.id}`)
}
export async function deleteNoticeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) {
    throw new Error("잘못된 요청입니다.")
  }

  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const notice = await getNotice(id)
  if (!notice) {
    throw new Error("존재하지 않는 게시글입니다.")
  }

  const isOwner = notice.authorId === session.user.id
  const isAdmin = session.user.role === "admin"
  if (!isOwner && !isAdmin) {
    throw new Error("삭제 권한이 없습니다.")
  }

  await deleteNotice(id)
  revalidatePath("/notices")
  redirect("/notices")
}
export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!name || !email || !password) {
    throw new Error("이름, 이메일, 비밀번호를 모두 입력해주세요.")
  }
  if (password.length < 8) {
    throw new Error("비밀번호는 최소 8자 이상이어야 합니다.")
  }
  await createUser({ name, email, password })
  await signIn("credentials", { email, password, redirectTo: "/" })
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1")
    }
    throw error
  }
}
export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
