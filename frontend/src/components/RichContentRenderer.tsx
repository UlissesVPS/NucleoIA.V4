import DOMPurify from 'dompurify';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

export default function RichContentRenderer({ content, className = '' }: RichContentRendererProps) {
  if (!content) return null;

  // Check if content is plain text (no HTML tags)
  const isPlainText = !/<[a-z][\s\S]*>/i.test(content);
  if (isPlainText) {
    return (
      <p className={`text-sm sm:text-base text-muted-foreground leading-relaxed ${className}`}>
        {content}
      </p>
    );
  }

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'del',
      'h2', 'h3', 'ul', 'ol', 'li',
      'blockquote', 'a', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });

  return (
    <div
      className={`prose prose-invert prose-sm max-w-none
        prose-headings:text-foreground prose-headings:font-semibold
        prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2
        prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1.5
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-1.5
        prose-a:text-orange-500 prose-a:underline hover:prose-a:text-orange-400
        prose-strong:text-foreground prose-strong:font-semibold
        prose-blockquote:border-l-orange-500/50 prose-blockquote:text-muted-foreground prose-blockquote:italic
        prose-ul:my-2 prose-ol:my-2 prose-li:text-muted-foreground prose-li:my-0.5
        prose-hr:border-border prose-hr:my-4
        ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
