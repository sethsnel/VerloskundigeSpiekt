import { useCallback, useRef, useState } from "react"
import { BaseEditor, BaseRange } from "slate"

export default function useSelection(editor: BaseEditor): [BaseRange | null, (newSelection: any) => void] {
  const [selection, setSelection] = useState(editor.selection)
  const previousSelection = useRef<BaseRange | null>(null)
  const setSelectionOptimized = useCallback(
    (newSelection) => {
      if (JSON.stringify(selection) === JSON.stringify(newSelection)) {
        return
      }
      previousSelection.current = selection
      setSelection(newSelection)
    },
    [setSelection, selection]
  )

  //return [previousSelection.current, selection, setSelectionOptimized]
  return [selection, setSelectionOptimized]
}