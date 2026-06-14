import {
  Home, BookOpen, Target, Newspaper, Trophy, MessageCircle,
  Calendar, Megaphone, Users, NotebookPen, User, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Full member navigation (desktop sidebar). */
export const memberNav: NavItem[] = [
  { href: "/", label: "בית", icon: Home },
  { href: "/courses", label: "שיעורים", icon: BookOpen },
  { href: "/tasks", label: "אתגרים", icon: Target },
  { href: "/feed", label: "קהילה", icon: Newspaper },
  { href: "/leaderboard", label: "דירוג", icon: Trophy },
  { href: "/messages", label: "הודעות", icon: MessageCircle },
  { href: "/calendar", label: "יומן", icon: Calendar },
  { href: "/announcements", label: "הכרזות", icon: Megaphone },
  { href: "/community", label: "דיונים", icon: Users },
  { href: "/notebook", label: "מחברת", icon: NotebookPen },
  { href: "/profile", label: "פרופיל", icon: User },
];

/** The 5 primary tabs for the mobile bottom bar. */
export const mobileNav: NavItem[] = [
  { href: "/", label: "בית", icon: Home },
  { href: "/courses", label: "שיעורים", icon: BookOpen },
  { href: "/feed", label: "קהילה", icon: Newspaper },
  { href: "/messages", label: "הודעות", icon: MessageCircle },
  { href: "/profile", label: "פרופיל", icon: User },
];

export const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
