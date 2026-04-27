type PracticeHeaderProps = {
  practiceName: string
}

const PracticeHeader = ({ practiceName }: PracticeHeaderProps) => (
  <h1 className="text-3xl font-semibold">Praktijk {practiceName}</h1>
)

export default PracticeHeader
