
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
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

const AdminShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      href: '/admin/users',
      label: 'ניהול משתמשים',
      icon: Users,
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
    }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Top Bar */}
      <header className="bg-card border-b border-border/50 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">לוח בקרה מנהלים</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            חזרה לאתר
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            יציאה
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-card border-l border-border/50 transition-all duration-300 flex-shrink-0",
            sidebarOpen ? "w-80" : "w-0 md:w-16",
            "md:relative absolute z-40 h-[calc(100vh-4rem)]"
          )}
        >
          <nav className="p-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg transition-all duration-200",
                    active 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", sidebarOpen ? "" : "mx-auto")} />
                  {sidebarOpen && (
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs opacity-80 mt-1 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="p-6 max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
