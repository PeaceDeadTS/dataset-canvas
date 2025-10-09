import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownImageModal } from './MarkdownImageModal';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            // Custom image renderer with click-to-enlarge functionality
            img: ({ src, alt, ...props }) => {
              const handleImageClick = () => {
                if (src) {
                  setImageModal({ src, alt: alt || 'Image' });
                }
              };

              return (
                <img
                  src={src}
                  alt={alt}
                  {...props}
                  className="inline-block max-w-full h-auto cursor-pointer rounded border border-border hover:border-primary transition-colors"
                  style={{ maxHeight: '400px' }}
                  onClick={handleImageClick}
                  loading="lazy"
                />
              );
            },
            // Custom link renderer for security
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
            // Code blocks with better styling
            code: ({ inline, className, children, ...props }: any) => {
              return inline ? (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className={`block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono ${className || ''}`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Better table styling
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full border-collapse border border-border"
                  {...props}
                >
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-border bg-muted px-4 py-2 text-left font-semibold"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-border px-4 py-2" {...props}>
                {children}
              </td>
            ),
            // Blockquotes styling
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            ),
            // Lists styling
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside my-2 space-y-1" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
                {children}
              </ol>
            ),
            // Headings styling
            h1: ({ children, ...props }) => (
              <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-2xl font-bold mt-5 mb-3" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-xl font-bold mt-4 mb-2" {...props}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 className="text-lg font-semibold mt-3 mb-2" {...props}>
                {children}
              </h4>
            ),
            // Horizontal rules
            hr: (props) => <hr className="my-8 border-border" {...props} />,
            // Paragraphs
            p: ({ children, ...props }) => (
              <p className="my-3 leading-7" {...props}>
                {children}
              </p>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {imageModal && (
        <MarkdownImageModal
          src={imageModal.src}
          alt={imageModal.alt}
          isOpen={!!imageModal}
          onClose={() => setImageModal(null)}
        />
      )}
    </>
  );
}

