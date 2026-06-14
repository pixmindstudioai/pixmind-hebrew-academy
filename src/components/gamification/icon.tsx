import {
  Award, Trophy, Star, Sparkles, Flame, Target, Heart, MessageCircle,
  GraduationCap, Footprints, Zap, Crown, Medal, Rocket, BookOpen,
  CheckCircle2, Users, TrendingUp, Circle, type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  Award, Trophy, Star, Sparkles, Flame, Target, Heart, MessageCircle,
  GraduationCap, Footprints, Zap, Crown, Medal, Rocket, BookOpen,
  CheckCircle2, Users, TrendingUp,
};

/** Resolve a lucide icon by name (badge.icon strings from the DB). */
export function getIcon(name?: string | null): LucideIcon {
  if (!name) return Circle;
  return REGISTRY[name] ?? Circle;
}
