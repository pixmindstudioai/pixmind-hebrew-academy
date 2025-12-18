import { useState } from 'react';
import { Bot, Send, Loader2, X, Sparkles, BookOpen, HelpCircle, Lightbulb, ListChecks, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLearningTools, MCPToolResult, TOOL_ICONS } from '@/hooks/useMCPTools';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AIAssistantPanelProps {
  lessonId: string;
  lessonTitle: string;
  className?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'tool-result';
  content: string;
  toolName?: string;
  data?: any;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'סכם את השיעור', icon: BookOpen, tool: 'summarize_lesson' },
  { id: 'takeaways', label: 'נקודות מפתח', icon: ListChecks, tool: 'extract_key_takeaways' },
  { id: 'quiz', label: 'צור חידון', icon: HelpCircle, tool: 'generate_quiz' },
  { id: 'flashcards', label: 'כרטיסיות לימוד', icon: Sparkles, tool: 'create_flashcards' },
  { id: 'examples', label: 'דוגמאות מעשיות', icon: Lightbulb, tool: 'generate_examples' },
  { id: 'action_plan', label: 'תוכנית פעולה', icon: ListChecks, tool: 'lesson_action_plan' },
];

export default function AIAssistantPanel({ lessonId, lessonTitle, className = '' }: AIAssistantPanelProps) {
  const { isAuthenticated } = useAuth();
  const tools = useLearningTools(lessonId);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }]);
  };

  const handleToolResult = (result: MCPToolResult, toolName: string) => {
    if (result.success) {
      addMessage({
        type: 'tool-result',
        content: '',
        toolName,
        data: result.data,
      });
    } else {
      addMessage({
        type: 'assistant',
        content: result.error || 'שגיאה בהפעלת הכלי',
      });
      toast.error(result.error || 'שגיאה בהפעלת הכלי');
    }
  };

  const executeQuickAction = async (actionId: string) => {
    if (!isAuthenticated) {
      toast.error('יש להתחבר כדי להשתמש בעוזר AI');
      return;
    }

    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    addMessage({ type: 'user', content: action.label });

    let result: MCPToolResult;
    switch (actionId) {
      case 'summarize':
        result = await tools.summarize('medium');
        break;
      case 'takeaways':
        result = await tools.getTakeaways();
        break;
      case 'quiz':
        result = await tools.generateQuiz(5, 'medium');
        break;
      case 'flashcards':
        result = await tools.createFlashcards(10);
        break;
      case 'examples':
        result = await tools.getExamples(undefined, 'intermediate');
        break;
      case 'action_plan':
        result = await tools.getActionPlan(24);
        break;
      default:
        return;
    }

    handleToolResult(result, action.tool);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !isAuthenticated) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ type: 'user', content: userMessage });

    // Simple intent detection
    const lowerInput = userMessage.toLowerCase();
    let result: MCPToolResult;
    let toolName: string;

    if (lowerInput.includes('סכם') || lowerInput.includes('סיכום')) {
      result = await tools.summarize('medium');
      toolName = 'summarize_lesson';
    } else if (lowerInput.includes('נקודות') || lowerInput.includes('מפתח') || lowerInput.includes('עיקרי')) {
      result = await tools.getTakeaways();
      toolName = 'extract_key_takeaways';
    } else if (lowerInput.includes('חידון') || lowerInput.includes('שאלות') || lowerInput.includes('בחן')) {
      result = await tools.generateQuiz(5, 'medium');
      toolName = 'generate_quiz';
    } else if (lowerInput.includes('כרטיס') || lowerInput.includes('flashcard')) {
      result = await tools.createFlashcards(10);
      toolName = 'create_flashcards';
    } else if (lowerInput.includes('דוגמ') || lowerInput.includes('example')) {
      result = await tools.getExamples(undefined, 'intermediate');
      toolName = 'generate_examples';
    } else if (lowerInput.includes('תוכנית') || lowerInput.includes('משימות') || lowerInput.includes('action')) {
      result = await tools.getActionPlan(24);
      toolName = 'lesson_action_plan';
    } else if (lowerInput.includes('הסבר') || lowerInput.includes('explain')) {
      // Extract concept from message
      const concept = userMessage.replace(/הסבר|explain|לי|את|מה זה/gi, '').trim();
      result = await tools.explain(concept || userMessage);
      toolName = 'explain_concept';
    } else {
      // Default to explanation
      result = await tools.explain(userMessage);
      toolName = 'explain_concept';
    }

    handleToolResult(result, toolName);
  };

  const toggleResultExpand = (id: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderToolResult = (message: Message) => {
    const { toolName, data, id } = message;
    const isExpanded = expandedResults.has(id);

    if (!data) return null;

    const icon = TOOL_ICONS[toolName || ''] || '🤖';

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleResultExpand(id)}>
        <Card className="bg-primary/5 border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{data.lessonTitle || lessonTitle}</span>
                </CardTitle>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* Summary */}
              {data.summary && (
                <div className="text-sm whitespace-pre-wrap">{data.summary}</div>
              )}

              {/* Takeaways */}
              {data.takeaways && (
                <div className="text-sm whitespace-pre-wrap">{data.takeaways}</div>
              )}

              {/* Explanation */}
              {data.explanation && (
                <div className="text-sm whitespace-pre-wrap">{data.explanation}</div>
              )}

              {/* Examples */}
              {data.examples && (
                <div className="text-sm whitespace-pre-wrap">{data.examples}</div>
              )}

              {/* Action Plan */}
              {data.actionPlan && (
                <div className="text-sm whitespace-pre-wrap">{data.actionPlan}</div>
              )}

              {/* Flashcards */}
              {data.flashcards && Array.isArray(data.flashcards) && (
                <div className="space-y-2">
                  <Badge variant="secondary">{data.flashcards.length} כרטיסיות</Badge>
                  {data.flashcards.slice(0, 5).map((card: any, idx: number) => (
                    <div key={idx} className="bg-background p-3 rounded-lg border">
                      <div className="font-medium text-sm mb-1">ש: {card.front}</div>
                      <div className="text-sm text-muted-foreground">ת: {card.back}</div>
                    </div>
                  ))}
                  {data.flashcards.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      + עוד {data.flashcards.length - 5} כרטיסיות
                    </div>
                  )}
                </div>
              )}

              {/* Quiz */}
              {data.quiz && Array.isArray(data.quiz) && (
                <div className="space-y-3">
                  <Badge variant="secondary">{data.quiz.length} שאלות</Badge>
                  {data.quiz.map((q: any, idx: number) => (
                    <div key={idx} className="bg-background p-3 rounded-lg border">
                      <div className="font-medium text-sm mb-2">{idx + 1}. {q.question}</div>
                      <div className="space-y-1">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <div 
                            key={optIdx} 
                            className={`text-sm p-2 rounded ${optIdx === q.correctIndex ? 'bg-green-500/20 text-green-700 dark:text-green-300' : ''}`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          הסבר: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Draft Comment */}
              {data.draft && (
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-sm whitespace-pre-wrap">{data.draft}</div>
                </div>
              )}

              {/* Check Questions */}
              {data.checkQuestions && (
                <div className="text-sm whitespace-pre-wrap">{data.checkQuestions}</div>
              )}

              {/* Feedback */}
              {data.feedback && (
                <div className="text-sm whitespace-pre-wrap">{data.feedback}</div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 rounded-full w-14 h-14 shadow-lg ${className}`}
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 left-6 z-50 w-96 max-w-[calc(100vw-48px)] shadow-xl ${className}`}>
      <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          עוזר AI לשיעור
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Quick Actions */}
        <div className="p-3 border-b bg-muted/30">
          <div className="text-xs text-muted-foreground mb-2">פעולות מהירות:</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map(action => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => executeQuickAction(action.id)}
                disabled={tools.isLoading || !isAuthenticated}
              >
                <action.icon className="w-3 h-3 ml-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-72 p-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>שלום! אני כאן לעזור לך בלמידה.</p>
              <p className="text-xs mt-1">בחר פעולה מהירה או שאל שאלה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => (
                <div key={message.id}>
                  {message.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  )}
                  {message.type === 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  )}
                  {message.type === 'tool-result' && renderToolResult(message)}
                </div>
              ))}
              {tools.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAuthenticated ? "שאל שאלה או בקש עזרה..." : "התחבר כדי להשתמש בעוזר"}
              disabled={tools.isLoading || !isAuthenticated}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || tools.isLoading || !isAuthenticated}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
