"use client"

import Link from "next/link"
import Image from "next/image"
import { FaHome, FaTags, FaWeight, FaUsers, FaHospital, FaAddressBook, FaCopy } from "react-icons/fa"

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

import SearchBar from "./search-bar"

const HorizontalMenu = () => {
  const { user } = useUser()

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
        <div className="md:flex-1 md:flex md:items-center md:justify-end">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex flex-wrap items-center justify-start gap-1 md:gap-2">
              <NavigationMenuItem className="relative">
                <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                  Algemeen
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[240px] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
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
              <NavigationMenuItem className="relative">
                <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                  Praktijk
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[260px] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
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
                <NavigationMenuItem className="relative">
                  <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-sm font-semibold md:text-base")}>
                    Admin
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute left-1/2 top-full mt-2 min-w-[220px] -translate-x-1/2 rounded-md border bg-popover p-3 shadow">
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
    </nav>
  )
}

export default HorizontalMenu
