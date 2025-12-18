
import { useState } from 'react';
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
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

const AdminShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const { logout } = useAdminAuth();
  const location = useLocation();

  const menuItems = [
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

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Top Bar */}
      <header className="bg-card border-b border-border/50 h-14 md:h-16 flex items-center justify-between px-3 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 p-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2 md:gap-3">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-base md:text-xl font-semibold hidden sm:block">לוח בקרה מנהלים</h1>
            <h1 className="text-base font-semibold sm:hidden">ניהול</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
            חזרה לאתר
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm px-2 md:px-4"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4" />
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
            "bg-card border-l border-border/50 transition-all duration-300 flex-shrink-0 overflow-y-auto",
            sidebarOpen ? "w-64 md:w-80" : "w-0",
            "fixed md:sticky top-14 md:top-16 z-40 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]"
          )}
        >
          <nav className={cn(
            "p-4 md:p-6 space-y-2",
            !sidebarOpen && "hidden"
          )}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)} // Close on mobile after click
                  className={cn(
                    "flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg transition-all duration-200",
                    active 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 md:w-6 md:h-6 flex-shrink-0",
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm md:text-base",
                      active ? "text-primary-foreground" : ""
                    )}>
                      {item.label}
                    </h3>
                    <p className={cn(
                      "text-xs md:text-sm mt-0.5 md:mt-1 line-clamp-2",
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
        <main className={cn(
          "flex-1 p-3 md:p-6 overflow-x-hidden w-full min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
