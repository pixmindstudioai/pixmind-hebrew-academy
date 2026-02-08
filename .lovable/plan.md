
# תוכנית תיקון באגים: קריסת מודאל אדמין וחסימת גישה למשימות

## סקירת הבעיות

### בעיה #1: קריסת מודאל אדמין בעת בחירת תמונה/קובץ
**מיקום הבאג:** `src/components/admin/LessonTaskManager.tsx`

**שורש הבעיה:** 
ברכיב `LessonTaskManager`, ה-Checkbox עבור סוגי הגשה (טקסט/קובץ/תמונה) אינו מחובר נכון:
- ה-`onClick` נמצא על ה-div העוטף
- ה-Checkbox עצמו חסר `onCheckedChange` handler
- כאשר לוחצים ישירות על ה-Checkbox (לא על ה-div), זה עלול לגרום להתנהגות לא צפויה

```typescript
// הקוד הנוכחי (בעייתי)
<div onClick={() => handleTypeToggle(type.value)}>
  <Checkbox checked={allowedTypes.includes(type.value)} disabled={disabled} />
  // חסר onCheckedChange!
</div>
```

### בעיה #2: חוסר חסימה אפקטיבית למשימות חובה
**מיקום הבאג:** `src/pages/LessonView.tsx`

**שורש הבעיה:**
כרגע, כשמשימת חובה לא הושלמה:
- מוצג רק `Alert` פשוט שניתן להתעלם ממנו
- התוכן נשאר נגיש ואינטראקטיבי לחלוטין
- המשתמש יכול לצרוך את השיעור בחופשיות

**הדרישה:** 
- מודאל מלא-מסך שלא ניתן לסגירה
- רקע מטושטש ולא אינטראקטיבי
- אי אפשר לסגור עם ESC או לחיצה מחוץ למודאל
- כפתור ניווט לדף המשימה

---

## פתרון בעיה #1: תיקון קריסת המודאל

### שינויים ב-`src/components/admin/LessonTaskManager.tsx`

1. **הוספת `onCheckedChange` ל-Checkbox** - לוודא שהאירוע מטופל נכון
2. **מניעת event propagation** - שה-Checkbox לא יפעיל גם את ה-onClick של ה-div
3. **הוספת `type="button"` implicit** - למניעת form submission

```typescript
// הקוד המתוקן
{SUBMISSION_TYPES.map(type => (
  <div
    key={type.value}
    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
      allowedTypes.includes(type.value)
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50'
    }`}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) handleTypeToggle(type.value);
    }}
  >
    <Checkbox
      checked={allowedTypes.includes(type.value)}
      disabled={disabled}
      onCheckedChange={(checked) => {
        if (!disabled) handleTypeToggle(type.value);
      }}
      onClick={(e) => e.stopPropagation()}
    />
    <type.icon className="w-4 h-4" />
    <span className="text-sm">{type.label}</span>
  </div>
))}
```

---

## פתרון בעיה #2: חסימת גישה אפקטיבית למשימות חובה

### יצירת רכיב חדש: `src/components/MandatoryTaskBlocker.tsx`

רכיב מודאל שלא ניתן לסגירה:

```typescript
interface MandatoryTaskBlockerProps {
  isBlocked: boolean;
  taskLessonId: string;
  taskLessonTitle?: string;
}
```

**תכונות הרכיב:**
- `AlertDialog` עם `open` קבוע (אין `onOpenChange`)
- רקע מטושטש באמצעות `backdrop-blur-md`
- חסימת ESC ולחיצה מחוץ למודאל (`onEscapeKeyDown` + `onInteractOutside`)
- כפתור יחיד: "עבור למשימה" שמנווט לשיעור עם המשימה

### עיצוב המודאל:
- כותרת: "יש להשלים משימה לפני המשך"
- הסבר: "שיעור זה כולל משימת חובה שעליך להשלים לפני שתוכל לצפות בתוכן"
- כפתור ראשי: "עבור למשימה" עם אייקון

### שינויים ב-`src/pages/LessonView.tsx`

1. **הסרת ה-Alert הנוכחי** - שמוצג כאשר השיעור חסום
2. **הוספת הרכיב `MandatoryTaskBlocker`** - עם הפרמטרים הנכונים
3. **טשטוש התוכן** - כאשר השיעור חסום, כל התוכן יהיה מטושטש

```typescript
// שימוש ברכיב החדש
<MandatoryTaskBlocker
  isBlocked={isCurrentLessonBlocked}
  taskLessonId={canProceedData?.blockedByLessonId}
  taskLessonTitle={/* שם השיעור החוסם */}
/>

{/* עטיפת התוכן ב-blur condition */}
<div className={cn(
  "transition-all duration-300",
  isCurrentLessonBlocked && "blur-sm pointer-events-none select-none"
)}>
  {/* כל תוכן השיעור */}
</div>
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/components/admin/LessonTaskManager.tsx` | תיקון Checkbox handlers |
| `src/components/MandatoryTaskBlocker.tsx` | **רכיב חדש** - מודאל חסימה |
| `src/pages/LessonView.tsx` | שילוב המודאל החדש + blur לתוכן |

---

## פרטים טכניים

### MandatoryTaskBlocker - מבנה הרכיב

```typescript
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MandatoryTaskBlocker = ({ isBlocked, taskLessonId, taskLessonTitle }) => {
  const navigate = useNavigate();
  
  if (!isBlocked || !taskLessonId) return null;
  
  return (
    <AlertDialog open={true}>
      <AlertDialogContent 
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* תוכן המודאל */}
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### LessonView - שילוב הפתרון

```typescript
return (
  <AuthGuard>
    <AccessGuard moduleId={...}>
      {/* מודאל החסימה - מעל הכל */}
      <MandatoryTaskBlocker
        isBlocked={isCurrentLessonBlocked}
        taskLessonId={canProceedData?.blockedByLessonId}
      />
      
      <div className={cn(
        "min-h-screen",
        isCurrentLessonBlocked && "blur-sm pointer-events-none"
      )}>
        {/* כל התוכן הקיים */}
      </div>
    </AccessGuard>
  </AuthGuard>
);
```

---

## בדיקות לאחר התיקון

| בדיקה | תוצאה צפויה |
|-------|-------------|
| לחיצה על "תמונה" במודאל משימה (אדמין) | המודאל נשאר פתוח, הבחירה משתנה |
| לחיצה על "קובץ" במודאל משימה (אדמין) | המודאל נשאר פתוח, הבחירה משתנה |
| פתיחת שיעור עם משימת חובה לא מאושרת | מודאל חסימה מופיע, תוכן מטושטש |
| לחיצת ESC במודאל החסימה | המודאל נשאר פתוח |
| לחיצה מחוץ למודאל החסימה | המודאל נשאר פתוח |
| לחיצה על "עבור למשימה" | ניווט לשיעור עם המשימה |
| שיעור עם משימה מאושרת | אין חסימה, תוכן נגיש |
