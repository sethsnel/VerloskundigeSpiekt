//import { unstable_cacheTag as cacheTag } from 'next/cache'

import { DefaultLayoutProps } from "../../components/layout"
import getMenuItems from "../firestore/articles/get-menu-items"

export default async function fetchLayoutProps(): Promise<DefaultLayoutProps> {
  // 'use cache'
  const menuItems = await getMenuItems()
  // cacheTag('layout-props')

  return {
    menuItems
  }
}
