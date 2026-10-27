import { Notice as NoticeModel } from "@/models/Notice"
import { connectDB } from "./mongodb"

export type Notice = {
  id: string
  title: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

type NoticeDocLike = {
  _id: unknown
  title: string
  authorId: unknown
  authorName: string
  content: string
  createdAt?: Date
}

function toNotice(doc: NoticeDocLike): Notice {
  return {
    id: String(doc._id),
    title: doc.title,
    authorId: String(doc.authorId),
    authorName: doc.authorName,
    content: doc.content,
    createdAt: (doc.createdAt ?? new Date()).toISOString().slice(0, 10),
  }
}

//async function seedIfEmpty() {
// const count = await NoticeModel.countDocuments()
// if (count > 0) return
// await NoticeModel.insertMany([
//  {
//    title: "추석 일정 안내",
//   author: "한종서",
//   content: "목요일부터 일요일",
// },
// {
// title: "음식 할인 품목 안내",
//  author: "한종서",
//  content: "이메일을 확인해주세요",
//},
//{
// title: "교통체증 안내",
//  author: "한종서",
// content: "9시부터 11시",
// },
// ])
//}

//const notices: Notice[] = [
//{
// id: "1",
// title: "추석 일정 안내",
// author: "한종서",
// content: "목요일부터 일요일",
// createdAt: "2026-09-01",
// },
//{
// id: "2",
// title: "음식 할인 품목 안내",
// author: "한종서",
//  content: "이메일을 확인해주세요",
// createdAt: "2026-09-03",
//},
//{
// id: "3",
// title: "교통체증 안내",
// author: "한종서",
//  content: "9시부터 11시",
//  createdAt: "2026-09-21",
// },
//]
//let nextId = 4

//function delay(ms: number) {
// return new Promise((resolve) => setTimeout(resolve, ms))

export async function getNotices(): Promise<Notice[]> {
  await connectDB()
  //await seedIfEmpty()

  const docs = await NoticeModel.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc) => toNotice(doc as NoticeDocLike))

  //await delay(600)
  //return [...notices].sort((a, b) => (a.id < b.id ? 1 : -1))
}

export async function getNotice(id: string): Promise<Notice | undefined> {
  await connectDB()
  try {
    const doc = await NoticeModel.findById(id).lean()
    return doc ? toNotice(doc as NoticeDocLike) : undefined
  } catch {
    return undefined
  }
  //await delay(400)
  //return notices.find((n) => n.id === id)
}

export async function createNotice(input: {
  title: string
  //author: string
  content: string
  authorId: string
  authorName: string
}): Promise<Notice> {
  //
  await connectDB()
  const doc = await NoticeModel.create(input)
  return toNotice(doc)
  // await delay(300)
  //const notice: Notice = {
  // id: String(nextId++),
  //title: input.title,
  // author: input.author,
  // content: input.content,
  // createdAt: new Date().toISOString().slice(0, 10), //new Date 날짜함수
}
// notices.push(notice)
// return notice
//}
export async function deleteNotice(id: string): Promise<void> {
  await connectDB()
  await NoticeModel.findByIdAndDelete(id)
}
