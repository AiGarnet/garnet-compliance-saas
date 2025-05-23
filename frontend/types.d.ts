// Type declarations for modules without type definitions
declare module 'react-markdown' {
  import React from 'react'
  
  interface ReactMarkdownProps {
    children: string
    className?: string
    components?: Record<string, React.ComponentType<any>>
  }
  
  const ReactMarkdown: React.FC<ReactMarkdownProps>
  
  export default ReactMarkdown
} 