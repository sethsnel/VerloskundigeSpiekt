import { Suspense } from "react"
import WeightForm from "./weight-form"

export default async function Page() {
  return <Suspense fallback={
    <div className="d-flex justify-content-center">
      <div className="spinner-grow" role="status" />
    </div>}>
    <WeightForm />
  </Suspense>
}
