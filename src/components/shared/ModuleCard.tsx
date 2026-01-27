import { Play, Clock, BookOpen, CheckCircle, Edit, Trash2, Eye, DollarSign, Shield, EyeOff, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Module } from "@/hooks/useContentData";
import { useModuleAccess } from "@/hooks/useUserModuleAccess";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SaleBadge } from "@/components/SaleBadge";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useNavigate } from "react-router-dom";

interface ModuleCardProps {
  module: Module;
  lessonsCount?: number;
  completedLessons?: number;
  duration?: string;
  isStarted?: boolean;
  isAdminView?: boolean;
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  onView?: (module: Module) => void;
  onClick?: (module: Module) => void;
}

const ModuleCard = ({
  module,
  lessonsCount = 0,
  completedLessons = 0,
  duration = "0 דקות",
  isStarted = false,
  isAdminView = false,
  onEdit,
  onDelete,
  onView,
  onClick,
}: ModuleCardProps) => {
  const { canAccessModule, hasAccess, isLegacyFreeUser } = useModuleAccess();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const progressPercentage = lessonsCount > 0 ? (completedLessons / lessonsCount) * 100 : 0;
  const isCompleted = completedLessons === lessonsCount && lessonsCount > 0;
  
  const moduleAccess = canAccessModule(module);
  const isPaidWithAccess = module.is_paid && hasAccess(module.id);
  const isLegacyFree = isLegacyFreeUser(module);

  const getStatusBadge = () => {
    const variants = {
      draft: { label: 'טיוטה', variant: 'secondary' as const },
      active: { label: 'פעיל', variant: 'default' as const },
      archived: { label: 'בארכיון', variant: 'outline' as const }
    };
    
    const config = variants[module.status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleModuleClick = (module: Module) => {
    if (isAdminView) {
      onClick?.(module);
      return;
    }

    if (!moduleAccess) {
      if (module.payment_url) {
        window.open(module.payment_url, '_blank');
      } else {
        toast.error('מודול זה בתשלום. אין לך גישה.');
      }
      return;
    }

    onClick?.(module);
  };

  return (
    <Card className="group overflow-hidden interactive-card border-border/40">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden aspect-video bg-muted">
          {(module.thumbnail_url || module.image_url) ? (
            <img 
              src={module.thumbnail_url || module.image_url} 
              alt={module.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Play overlay for user view */}
          {!isAdminView && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-primary-foreground mr-0.5" />
              </div>
            </div>
          )}

          {/* Status badge for admin view */}
          {isAdminView && (
            <div className="absolute top-3 left-3 flex gap-2">
              {getStatusBadge()}
              {module.is_hidden && (
                <Badge variant="secondary">
                  <EyeOff className="w-3 h-3 ml-1" />
                  מוסתר
                </Badge>
              )}
            </div>
          )}

          {/* Payment/Access badge for user view */}
          {!isAdminView && module.is_paid && (
            <div className="absolute top-3 right-3">
              {isLegacyFree ? (
                <Badge variant="success">
                  <Gift className="w-3 h-3 ml-1" />
                  גישה חינמית
                </Badge>
              ) : isPaidWithAccess ? (
                <Badge variant="success">
                  <Shield className="w-3 h-3 ml-1" />
                  יש לך גישה
                </Badge>
              ) : (
                <Badge variant="warning">
                  <DollarSign className="w-3 h-3 ml-1" />
                  בתשלום
                </Badge>
              )}
            </div>
          )}

          {/* Progress indicator for user view */}
          {!isAdminView && isStarted && !isCompleted && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {progressPercentage.toFixed(0)}%
              </Badge>
            </div>
          )}

          {/* Completion badge */}
          {!isAdminView && isCompleted && (
            <div className="absolute top-3 left-3">
              <Badge variant="success">
                <CheckCircle className="w-3 h-3 ml-1" />
                הושלם
              </Badge>
            </div>
          )}

          {/* Admin actions */}
          {isAdminView && (
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(module)}>
                      <Eye className="w-4 h-4 ml-2" />
                      צפייה
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(module)}>
                      <Edit className="w-4 h-4 ml-2" />
                      עריכה
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(`/admin/modules/${module.id}/cohorts`)}>
                    <Users className="w-4 h-4 ml-2" />
                    מחזורים
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(module)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחיקה
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {module.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Sale badge and pricing */}
        {!isAdminView && module.is_paid && !isLegacyFree && (
          <div className="mb-4 space-y-2">
            <SaleBadge module={module} size="sm" />
            <PriceDisplay module={module} size="sm" isLegacyFreeUser={isLegacyFree} />
          </div>
        )}

        {/* Course stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{lessonsCount} שיעורים</span>
          </div>
        </div>

        {/* Progress bar for user view */}
        {!isAdminView && isStarted && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">התקדמות</span>
              <span className="text-xs text-muted-foreground">
                {completedLessons}/{lessonsCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Admin info */}
        {isAdminView && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <div className="flex justify-between">
              <span>סדר:</span>
              <span>{module.order_index}</span>
            </div>
            <div className="flex justify-between">
              <span>נוצר:</span>
              <span>{new Date(module.created_at).toLocaleDateString('he-IL')}</span>
            </div>
            {module.was_free_before && (
              <div className="flex items-center gap-1 text-success mt-2">
                <Gift className="w-3 h-3" />
                <span>היה חינמי בעבר</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button 
          className="w-full" 
          variant={isStarted || isAdminView ? "default" : "outline"}
          onClick={() => handleModuleClick(module)}
        >
          {isAdminView 
            ? "ניהול מודול"
            : !moduleAccess
              ? "רכישה"
              : isCompleted 
                ? "צפה שוב" 
                : isStarted 
                  ? "המשך לימוד" 
                  : "התחל ללמוד"
          }
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModuleCard;
