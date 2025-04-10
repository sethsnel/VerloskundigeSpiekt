import { Metadata } from "next"
import { Suspense } from "react"

import SearchPage from "./search"

type SearchParamsType = {
  searchParams: Promise<{ q: string, pageSize?: number, skip?: number, top?: number, includeFacets?: boolean }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: SearchParamsType): Promise<Metadata> {
  const { q } = await searchParams

  return {
    title: q
  }
}

export default async function Page({ searchParams }: SearchParamsType) {
  return <Suspense fallback={
    <div className="d-flex justify-content-center">
      <div className="spinner-grow" role="status" />
    </div>}>
    <SearchPage />
  </Suspense>
}
