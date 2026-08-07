"use client"

import DOMPurify from "dompurify"
import { useMemo } from "react"

interface RichTextViewerProps {
  html: string | null | undefined
  className?: string
  fallback?: string
}

export function RichTextViewer({
  html,
  className = "",
  fallback,
}: RichTextViewerProps) {
  const sanitized = useMemo(() => {
    if (!html) return null

    let result = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "hr",
        "strong", "b", "em", "i", "u", "s", "sub", "sup",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "a",
        "blockquote",
        "pre", "code",
        "span", "div",
        "table", "thead", "tbody", "tfoot", "tr", "th", "td",
        "img",
        "figure", "figcaption",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel",
        "src", "alt", "width", "height",
        "colspan", "rowspan",
        "class", "style",
      ],
    })

    result = result.replace(
      /<a\b(?![^>]*\btarget\s*=)([^>]*)>/gi,
      (match) => {
        if (!/\bhref\s*=/.test(match)) return match
        return match.replace(">", ' target="_blank" rel="noopener noreferrer">')
      }
    )

    return result
  }, [html])

  if (!sanitized) {
    if (fallback) {
      return (
        <span className={`text-muted-foreground ${className}`}>
          {fallback}
        </span>
      )
    }
    return null
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert prose-headings:font-heading prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
