'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({
            inline,
            className,
            children,
            ...props
          }: React.HTMLAttributes<HTMLElement> & {
            inline?: boolean
            className?: string
            children?: React.ReactNode
          }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-lg text-sm my-2"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          },
          ul({ children }) {
            return <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2 text-gray-700">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="px-3 py-2 text-sm text-gray-800 border-b">{children}</td>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
