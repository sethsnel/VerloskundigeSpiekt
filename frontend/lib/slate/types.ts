
export interface BaseProps {
  className: string
  iconType: string
  active: boolean
  disabled?: boolean
  [key: string]: unknown
}
export type OrNull<T> = T | null
