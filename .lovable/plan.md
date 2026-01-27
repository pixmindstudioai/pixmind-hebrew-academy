

## תיקון שגיאת "Maximum update depth exceeded" ברכיב Switch

### תיאור הבעיה
השגיאה מתרחשת בגלל לולאת עדכונים אינסופית ברכיבי Switch של Radix UI. הבעיה קורית כאשר קוראים ישירות ל-setState בתוך onCheckedChange, מה שגורם להתנגשות עם המנגנון הפנימי של הרכיב.

### קבצים שצריך לתקן

**src/components/admin/LessonTaskManager.tsx**
- שורה 207: השימוש ב-`onCheckedChange={setIsEnabled}` גורם ללולאה אינסופית

### הפתרון הטכני

יש להוסיף פונקציית wrapper שבודקת אם הערך באמת השתנה לפני עדכון ה-state:

```typescript
const handleEnabledChange = (checked: boolean) => {
  setIsEnabled((prev) => (prev === checked ? prev : checked));
};
```

ואז להשתמש בפונקציה במקום setter ישיר:

```tsx
<Switch
  id="task-enabled"
  checked={isEnabled}
  onCheckedChange={handleEnabledChange}
  disabled={disabled}
/>
```

### שינויים נדרשים

1. **ב-LessonTaskManager.tsx:**
   - הוספת פונקציית `handleEnabledChange` אחרי הגדרת ה-states (שורה 74)
   - עדכון ה-Switch בשורה 204-209 להשתמש בפונקציה החדשה

### למה הפתרון עובד?

הפתרון מונע עדכון state כאשר הערך לא באמת משתנה. כאשר Radix UI Switch מפעיל את ה-callback כחלק מסנכרון פנימי, אם הערך זהה לקודם - לא מתבצע עדכון ולא נגרמת רנדור מחודש, וכך נשברת הלולאה האינסופית.

