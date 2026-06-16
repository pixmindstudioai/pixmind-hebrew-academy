import { useState, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  MessageSquare, 
  BookOpen, 
  Settings as SettingsIcon,
  LogOut,
  Shield,
  Users,
  CreditCard,
  ShoppingCart,
  Bot,
  ChevronLeft,
  Package,

  Users2,
  Megaphone,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  Award,
  Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';

const AdminShell = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAdminAuth();
  const location = useLocation();

  const menuItems = [
    {
      href: '/admin',
      label: 'דשבורד',
      icon: LayoutDashboard,
      description: 'סקירת נתוני האקדמייה ומדדי גיימיפיקציה'
    },
    {
      href: '/admin/moderation',
      label: 'ניהול תגובות',
      icon: MessageSquare,
      description: 'ניהול והחלטה על תגובות מדווחות'
    },
    {
      href: '/admin/content',
      label: 'ניהול תוכן',
      icon: BookOpen,
      description: 'יצירה ועריכה של מודולים, פרקים ושיעורים'
    },
    {
      href: '/admin/bundles',
      label: 'חבילות קורסים',
      icon: Package,
      description: 'יצירה וניהול חבילות קורסים משולבות'
    },
    {
      href: '/admin/discussions',
      label: 'קבוצות ודיונים',
      icon: Users2,
      description: 'ניהול קבוצות דיון ופורומים'
    },
    {
      href: '/admin/feed-moderation',
      label: 'ניהול פיד הקהילה',
      icon: Newspaper,
      description: 'הצמדה, מחיקה וניהול פוסטים ותגובות בקהילה'
    },
    {
      href: '/admin/announcements',
      label: 'הכרזות',
      icon: Megaphone,
      description: 'ניהול הכרזות והודעות למשתמשים'
    },
    {
      href: '/admin/calendar',
      label: 'יומן',
      icon: Calendar,
      description: 'ניהול אירועים, מפגשים ודדליינים'
    },
    {
      href: '/admin/tasks',
      label: 'ניהול משימות',
      icon: ClipboardCheck,
      description: 'ניהול משימות והגשות בכל הקורסים'
    },
    {
      href: '/admin/task-review',
      label: 'בדיקת ביצועי משימות',
      icon: ClipboardCheck,
      description: 'סקירה ואישור ידני של הגשות משימות (מעניק XP)'
    },
    {
      href: '/admin/badges',
      label: 'תגים והישגים',
      icon: Award,
      description: 'יצירה וניהול של תגים, רמות והענקה לתלמידים'
    },
    {
      href: '/admin/students',
      label: 'ניהול תלמידים',
      icon: Users,
      description: 'צפייה וניהול של כל התלמידים והרשמות'
    },
    {
      href: '/admin/crm',
      label: 'CRM',
      icon: MessageSquare,
      description: 'תיבת דואר וניהול פניות מתלמידים'
    },
    {
      href: '/admin/users',
      label: 'הרשאות גישה',
      icon: Shield,
      description: 'מנהל הרשאות גישה למודולים עבור משתמשים'
    },
    {
      href: '/admin/payments',
      label: 'עסקאות והרשמות',
      icon: CreditCard,
      description: 'צפייה וניהול הרשמות ממשולם'
    },
    {
      href: '/admin/purchases',
      label: 'רכישות',
      icon: ShoppingCart,
      description: 'מעקב אחר כל התשלומים והרכישות'
    },
    {
      href: '/admin/settings',
      label: 'הגדרות',
      icon: SettingsIcon,
      description: 'הגדרות כלליות של המערכת'
    },
    {
      href: '/admin/mcp-tools',
      label: 'כלי MCP',
      icon: Bot,
      description: 'ניהול כלי AI לתלמידים ומנהלים'
    }
  ];

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Top Bar */}
      <header className="bg-card border-b border-border/50 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 pt-[env(safe-area-inset-top)] box-content">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-10 w-10"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">לוח בקרה</h1>
              <p className="text-xs text-muted-foreground">ניהול האקדמיה</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1"
          >
            חזרה לאתר
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">יציאה</span>
          </Button>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-card border-l border-border/50 transition-all duration-300 flex-shrink-0 overflow-y-auto scrollbar-hide",
            sidebarOpen ? "w-[85vw] max-w-72" : "w-0",
            "fixed md:sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 h-[calc(100vh-4rem-env(safe-area-inset-top))]"
          )}
        >
          <nav className={cn(
            "p-4 space-y-1",
            !sidebarOpen && "hidden"
          )}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                    active 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 mt-0.5",
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm",
                      active ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {item.label}
                    </h3>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-2",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden w-full min-h-[calc(100vh-4rem-env(safe-area-inset-top))]">
          <ErrorBoundary label="טעינת העמוד">
            {children ?? <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
