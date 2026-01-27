
# תוכנית תיקון מערכת המשימות

## סיכום המצב הנוכחי

לאחר בדיקה מעמיקה, מערכת המשימות כבר מחוברת ל-Supabase ורוב הלוגיקה קיימת, אך יש בעיה אחת קריטית שמונעת מהעמוד לטעון כראוי.

## בעיה עיקרית שנמצאה

### שגיאת React בקומפוננט TaskSubmissionSection

בקובץ `src/components/lesson/TaskSubmissionSection.tsx` (שורות 59-64) יש קוד שמפר את כללי React:

```typescript
// ❌ קוד בעייתי - קריאה ל-setState בזמן רנדור
if (effectiveStatus === 'rejected' && prevStatus !== 'rejected' && submission) {
  setPrevStatus('rejected');
  setShowRejectedDialog(true);
}
```

קריאה ל-`setState` בזמן הרנדור (לא בתוך `useEffect`) גורמת ללולאות עדכון אינסופיות.

## מה כבר עובד

| רכיב | סטטוס |
|------|-------|
| חיבור ל-Supabase | ✅ עובד |
| טבלאות `lesson_tasks` ו-`task_submissions` | ✅ קיימות |
| הרשאות RLS | ✅ מוגדרות נכון |
| Edge Function לאימות AI | ✅ מוכן (עם LOVABLE_API_KEY) |
| לוגיקת חסימת התקדמות | ✅ מיושמת ב-useCanProceedToLesson |
| ממשק אדמין לניהול משימות | ✅ פעיל |
| אפשרות לעקוף החלטת AI | ✅ קיימת |

## תוכנית התיקון

### שלב 1: תיקון שגיאת React

**קובץ**: `src/components/lesson/TaskSubmissionSection.tsx`

העברת הלוגיקה של הצגת הדיאלוג לתוך `useEffect`:

```typescript
// ✅ קוד מתוקן
useEffect(() => {
  if (effectiveStatus === 'rejected' && submission) {
    setShowRejectedDialog(true);
  }
}, [effectiveStatus, submission]);
```

**למה זה מתקן את הבעיה?**
- React דורש שכל שינויי state יקרו בתוך event handlers או useEffect
- הקוד הקיים מפעיל setState בזמן הרנדור, מה שגורם לרנדור נוסף, שמפעיל setState שוב - לולאה אינסופית

### שלב 2: אימות תהליך ה-AI

הפונקציה `validate-task` כבר מוגדרת נכון:
- משתמשת ב-LOVABLE_API_KEY (שקיים כ-Secret)
- קוראת ל-Google Gemini דרך Lovable AI Gateway
- מחזירה approved/rejected עם הסבר

**פעולה נדרשת**: בדיקה שה-Edge Function פרוסה

### שלב 3: וידוא לוגיקת החסימה

הלוגיקה כבר מיושמת בקוד:

1. `useCanProceedToLesson` - בודק אם המשתמש יכול להמשיך לשיעור הבא
2. `LessonView.tsx` - מציג התראה על שיעור נעול
3. `isNextLessonBlocked()` - מונע ניווט לשיעור הבא

---

## פירוט טכני

### קבצים לעריכה

**1. src/components/lesson/TaskSubmissionSection.tsx**

שינויים:
- הסרת הקוד הבעייתי בשורות 57-64
- הוספת useEffect לניהול הדיאלוג
- הסרת ה-state `prevStatus` שלא נחוץ יותר

```typescript
// לפני התיקון (שורות 57-64):
const [prevStatus, setPrevStatus] = useState<string | null>(null);
if (effectiveStatus === 'rejected' && prevStatus !== 'rejected' && submission) {
  setPrevStatus('rejected');
  setShowRejectedDialog(true);
} else if (effectiveStatus !== 'rejected' && prevStatus === 'rejected') {
  setPrevStatus(effectiveStatus);
}

// אחרי התיקון:
useEffect(() => {
  // הצג דיאלוג רק כאשר הסטטוס הוא rejected ויש הגשה
  if (effectiveStatus === 'rejected' && submission) {
    setShowRejectedDialog(true);
  }
}, [effectiveStatus, submission]);
```

---

## תוצאות צפויות

לאחר התיקון:
1. דף המשימות יטען בהצלחה ללא שגיאות
2. משימות יוצגו מקובצות לפי קורס
3. סטטוס כל משימה יוצג (לא הוגש/בבדיקה/אושר/נדחה)
4. משימות חובה ימנעו מעבר לשיעור הבא עד לאישור
5. הדיאלוג של דחייה יופיע כראוי

## הערות נוספות

- ה-LOVABLE_API_KEY כבר מוגדר ב-Secrets
- אין צורך ב-Google Gemini API Key נפרד - המערכת משתמשת ב-Lovable AI Gateway
- כל טקסטי הממשק כבר בעברית
- הממשק כבר מותאם ל-RTL
