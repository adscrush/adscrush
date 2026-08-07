export function getInitials(name?: string | null): string {
  if (!name?.trim()) return "??"
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
