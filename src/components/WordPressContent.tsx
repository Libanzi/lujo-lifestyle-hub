interface WordPressContentProps {
  content: string;
}

export const WordPressContent = ({ content }: WordPressContentProps) => {
  return (
    <div 
      className="prose prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
