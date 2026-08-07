interface ContentShellProps {
  children: React.ReactNode
  className?: string
}

export function ContentShell({ children, className }: ContentShellProps) {
  return (
    <div className={`flex flex-1 flex-col gap-6 p-6 ${className ?? ""}`}>
      {children}
    </div>
  )
}
