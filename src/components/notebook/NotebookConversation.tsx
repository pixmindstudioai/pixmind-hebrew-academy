import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, ArrowRight, Video, Sparkles, HelpCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  NotebookEntry,
  NotebookMessage,
  useNotebookMessages,
  useSendAIMessage
} from '@/hooks/useNotebookData';

interface NotebookConversationProps {
  entry: NotebookEntry;
  lessonDescription?: string;
  onBack: () => void;
}

const QUICK_PROMPTS = [
  { text: 'הסבר לי את הנושא בקצרה', icon: Sparkles },
  { text: 'למה זה חשוב?', icon: HelpCircle },
  { text: 'תן לי דוגמה מעשית', icon: Lightbulb },
];

export default function NotebookConversation({
  entry,
  lessonDescription,
  onBack
}: NotebookConversationProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: messages = [], isLoading: messagesLoading } = useNotebookMessages(entry.id);
  const sendMessage = useSendAIMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    
    setInput('');
    
    await sendMessage.mutateAsync({
      entryId: entry.id,
      userMessage: messageText,
      lessonTitle: entry.lesson_title,
      lessonDescription,
      videoUrl: entry.video_url || undefined,
      conversationHistory: messages
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{entry.lesson_title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {entry.video_url && (
                <Badge variant="secondary" className="gap-1">
                  <Video className="w-3 h-3" />
                  וידאו
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                נוסף ב-{format(new Date(entry.created_at), 'dd/MM/yyyy', { locale: he })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <h3 className="font-medium text-lg mb-2">ברוך הבא למחברת החכמה</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                שאל אותי כל שאלה על השיעור "{entry.lesson_title}" ואעזור לך להבין את החומר
              </p>
              
              {/* Quick prompts */}
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSend(prompt.text)}
                  >
                    <prompt.icon className="w-4 h-4" />
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {sendMessage.isPending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">חושב...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל שאלה על השיעור..."
            className="min-h-[80px] resize-none"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || sendMessage.isPending}
            className="shrink-0 self-end"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          לחץ Enter לשליחה, Shift+Enter לשורה חדשה
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: NotebookMessage }) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      'flex items-start gap-3',
      isUser && 'flex-row-reverse'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-primary' : 'bg-primary/10'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.message}
        </p>
        <p className={cn(
          'text-[10px] mt-2',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {format(new Date(message.created_at), 'HH:mm', { locale: he })}
        </p>
      </div>
    </div>
  );
}
