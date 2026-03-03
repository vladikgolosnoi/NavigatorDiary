type BadgeRowProps = {
  items?: string[]
}

export function BadgeRow({ items = [] }: BadgeRowProps) {
  if (!items.length) {
    return null
  }
  return (
    <div className="badge-row">
      {items.map((item) => (
        <span key={item} className="badge">
          {item}
        </span>
      ))}
    </div>
  )
}
