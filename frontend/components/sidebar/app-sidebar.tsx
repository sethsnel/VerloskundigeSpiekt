import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar"

import type { JSX } from "react";

interface OffcanvasMenuProps {
  children: JSX.Element
}

export function AppSidebar({ children }: OffcanvasMenuProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {children}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}