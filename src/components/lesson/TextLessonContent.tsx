interface TextLessonContentProps {
  richText?: string;
  description?: string;
}

const TextLessonContent = ({ richText, description }: TextLessonContentProps) => {
  return (
    <div className="prose prose-lg max-w-none rtl text-right">
      {description && (
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          {description}
        </p>
      )}
      
      {richText && (
        <div 
          className="lesson-content"
          dangerouslySetInnerHTML={{ __html: richText }}
        />
      )}

      {!richText && !description && (
        <p className="text-muted-foreground italic">אין תוכן טקסט לשיעור זה</p>
      )}
    </div>
  );
};

export default TextLessonContent;
