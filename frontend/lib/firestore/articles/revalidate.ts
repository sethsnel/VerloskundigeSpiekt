"use server"

import { revalidatePath as revalidate } from "next/cache"

async function revalidatePath(name: string, type?: 'page' | 'layout') {
  revalidate(name, type)
}

export default revalidatePath