"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { FaHome, FaTags, FaWeight, FaUsers, FaHospital, FaAddressBook, FaCopy, FaBars, FaTimes, FaFile, FaHandSparkles } from "react-icons/fa"

import { useUser } from "@/lib/auth/use-user"
import { cn } from "@/lib/ui/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import SearchBar from "./search-bar"

const HorizontalMenu = () => {
  const { user } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const algemeenItems = [
    {
      title: "Home",
      url: "/",
      icon: FaHome,
    },
    {
      title: "Tags",
      url: "/tags",
      icon: FaTags,
    },
  ]

  const praktijkItems = [
    {
      title: "Contacten",
      url: "/artikel/LesCnRcM5bwiNpM1oJdZ",
      icon: FaAddressBook,
    },
    {
      title: "Ziekenhuizen",
      url: "/artikel/oQBToFdcvTSal8kV3tSv",
      icon: FaHospital,
    },
    {
      title: "Sjablonen",
      url: "/artikel/k58Ds0rTFkFRnqLMwRvR",
      icon: FaCopy,
    },
    {
      title: "Assistente Spiekt",
      url: "/artikel/nM8TUM2RTKcmbak9cZBr",
      icon: FaHandSparkles,
    },
    {
      title: "Documenten",
      url: "/artikel/IwA2UVz80Qw49qfhepLm",
      icon: FaFile,
    },
    {
      title: "Gewicht",
      url: "/gewicht",
      icon: FaWeight,
    },
  ]

  const adminItems = user?.hasAdminRights()
    ? [
      {
        title: "Gebruikersbeheer",
        url: "/admin/users",
        icon: FaUsers,
      },
    ]
    : []

  return (
    <nav className="w-full bg-(--background-color) pb-3 mb-4">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center justify-center md:flex-1 md:justify-start">
          <Link href="/" aria-label="Ga naar home">
            <Image
              src="/images/vs-logo.webp"
              height={44}
              width={44}
              alt="logo verloskundige spiekt"
              className="rounded-full"
              loading="eager"
              priority
            />
          </Link>
        </div>
        <div className="w-full md:max-w-xs md:flex-1 md:flex md:items-center md:justify-center">
          <SearchBar className="w-full" compact />
        </div>
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-end">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex flex-wrap items-center justify-start gap-1 md:gap-2">
              <NavigationMenuItem className="relative last:[&>div]:left-auto last:[&>div]:right-0 last:[&>div]:translate-x-0">
                <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                  Algemeen
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[240px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
                  <div className="grid gap-2">
                    {algemeenItems.map((item) => (
                      <NavigationMenuLink
                        key={item.title}
                        asChild
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--header-color)] transition-colors hover:bg-accent hover:text-accent-foreground md:text-base"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className="text-base" />
                          <span>{item.title}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem className="relative last:[&>div]:left-auto last:[&>div]:right-0 last:[&>div]:translate-x-0">
                <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                  Praktijk
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[260px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
                  <div className="grid gap-2">
                    {praktijkItems.map((item) => (
                      <NavigationMenuLink
                        key={item.title}
                        asChild
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--header-color)] transition-colors hover:bg-accent hover:text-accent-foreground md:text-base"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className="text-base" />
                          <span>{item.title}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {adminItems.length > 0 ? (
                <NavigationMenuItem className="relative last:[&>div]:left-auto last:[&>div]:right-0 last:[&>div]:translate-x-0">
                  <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                    Admin
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[220px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
                    <div className="grid gap-2">
                      {adminItems.map((item) => (
                        <NavigationMenuLink
                          key={item.title}
                          asChild
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--header-color)] transition-colors hover:bg-accent hover:text-accent-foreground md:text-base"
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon className="text-base" />
                            <span>{item.title}</span>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : null}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            className="fixed bottom-4 right-4 left-auto z-40 rounded-full px-5 py-3 text-sm font-semibold shadow-lg md:hidden"
            aria-label="Open menu"
          >
            <FaBars className="text-base" />
            Menu
          </Button>
        </DialogTrigger>
        <DialogContent
          className="h-[100dvh] w-[100dvw] max-w-none rounded-none border-0 p-0"
          showCloseButton={false}
        >
          <div className="flex h-full flex-col bg-(--background-color)">
            <DialogHeader className="flex items-center justify-between border-b px-6 py-4 text-left">
              <DialogTitle className="text-lg font-semibold text-[var(--header-color)]">
                Menu
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Sluit menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaTimes />
              </Button>
            </DialogHeader>
            <div className="px-6 py-4">
              <SearchBar className="w-full" compact />
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--header-color)]">Algemeen</p>
                <div className="grid gap-2">
                  {algemeenItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-semibold text-[var(--header-color)]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="text-base" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--header-color)]">Praktijk</p>
                <div className="grid gap-2">
                  {praktijkItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-semibold text-[var(--header-color)]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="text-base" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {adminItems.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[var(--header-color)]">Admin</p>
                  <div className="grid gap-2">
                    {adminItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-semibold text-[var(--header-color)]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="text-base" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}

export default HorizontalMenu
