'use client'
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function WeightFormPage() {
  const [birthWeight, setBirthWeight] = useState<string | null>(null)
  const [currentWeight, setCurrentWeight] = useState<string | null>(null)

  let weightChange, percentageChange = undefined

  const birth = parseFloat(birthWeight || "NaN")
  const current = parseFloat(currentWeight || "NaN")

  if (!isNaN(birth) && !isNaN(current) && current > 1000) {
    weightChange = current - birth
    percentageChange = Math.round((1 - current / birth) * -1000) / 10
  }

  return <div className="flex flex-col gap-3 justify-center items-center min-h-200">
    <div className="flex w-full max-w-lg justify-between items-center gap-2">
      <span>Geboorte gewicht (g)</span>
      <Input className="max-w-xs text-right rounded-3xl" name="birth-weight" onChange={e => setBirthWeight(e.currentTarget.value)} />
    </div>
    <div className="flex w-full max-w-lg justify-between items-center gap-2">
      <span>Huidig gewicht (g)</span>
      <Input className="max-w-xs text-right rounded-3xl" name="current-weight" onChange={e => setCurrentWeight(e.currentTarget.value)} />
    </div>
    <div className="flex w-full max-w-lg justify-between items-center gap-2">
      {weightChange && <div>Gewicht</div>}
      {weightChange && <div>{weightChange} gr</div>}
    </div>
    <div className="flex w-full max-w-lg justify-between items-center gap-2">
      {percentageChange && <div>Percentage</div>}
      {percentageChange && <div>{percentageChange} %</div>}
    </div>
  </div>
}
