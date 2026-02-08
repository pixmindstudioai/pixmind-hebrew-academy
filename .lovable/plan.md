
# תוכנית ארכיטקטורה חדשה למשימות - דף משימה עצמאי

## סקירת הבעיות הנוכחיות

### מה לא עובד כרגע:
1. **משימות מוצגות בתוך שיעורים** - ההגשה מתבצעת ב-`LessonView` דרך `TaskSubmissionSection`
2. **אין דף משימה עצמאי** - לא קיים route `/tasks/{task_id}`
3. **לחיצה על משימה מעבירה לשיעור** - במקום לדף משימה ייעודי
4. **חסימה לא מפנה למשימה** - `MandatoryTaskBlocker` מפנה ל-`/tasks` או לשיעור

---

## ארכיטקטורה חדשה

### 1. יצירת דף משימה עצמאי: `/tasks/{taskId}`

**קובץ חדש:** `src/pages/TaskView.tsx`

דף זה יכלול:
- כותרת המשימה (שם השיעור המקושר)
- הוראות המשימה בצורה ברורה
- סוגי הגשה מותרים (טקסט / תמונה / קובץ)
- טופס הגשה עם:
  - Textarea לטקסט
  - העלאת קובץ/תמונה
  - כפתור "שלח משימה"
- סטטוס נוכחי:
  - לא הוגש
  - בבדיקת AI
  - אושר (עם popup הצלחה)
  - נדחה (עם הסבר)
- Breadcrumb לניווט חזרה

### 2. עדכון דף רשימת המשימות: `/tasks`

**קובץ:** `src/pages/Tasks.tsx`

שינויים:
- הכפתור "עבור לשיעור" ישתנה ל-"עבור למשימה"
- לחיצה תפנה ל-`/tasks/{taskId}` במקום `/lesson/{lessonId}`
- הוספת מידע נוסף על כל משימה בכרטיס

### 3. עדכון חסימת שיעור: `MandatoryTaskBlocker`

**קובץ:** `src/components/MandatoryTaskBlocker.tsx`

שינויים:
- כפתור "מעבר למשימה" יפנה ל-`/tasks/{taskId}` 
- דורש קבלת `taskId` כ-prop (בנוסף ל-`taskLessonId`)
- הודעה ברורה יותר בעברית

### 4. עדכון LessonView - הסרת הגשה inline

**קובץ:** `src/pages/LessonView.tsx`

שינויים:
- הסרת רכיב `TaskSubmissionSection` מה-inline
- החלפה בכרטיס "יש משימה בשיעור זה" עם קישור לדף המשימה
- עדכון `MandatoryTaskBlocker` לשלוח `taskId`

### 5. עדכון Routing

**קובץ:** `src/App.tsx`

הוספת route חדש:
```typescript
<Route path="/tasks/:taskId" element={<><Navigation /><TaskView /></>} />
```

### 6. הוספת Hook לטעינת משימה בודדת

**קובץ:** `src/hooks/useTasksData.ts`

הוספת:
```typescript
export const useTaskById = (taskId: string) => {
  // טעינת משימה עם פרטי השיעור המקושר
}
```

---

## מבנה דף המשימה החדש (`TaskView.tsx`)

```text
+------------------------------------------+
|  📋 Breadcrumb: קורסים > שם הקורס > שם השיעור > משימה  |
+------------------------------------------+
|                                          |
|  ┌────────────────────────────────────┐  |
|  │  משימת שיעור: "שם השיעור"           │  |
|  │  Badge: חובה / רשות                │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │  הוראות המשימה:                     │  |
|  │  [תוכן ההוראות מהמשימה]            │  |
|  │                                    │  |
|  │  סוגי הגשה מותרים: טקסט, תמונה     │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │  סטטוס: [Badge עם סטטוס נוכחי]     │  |
|  │                                    │  |
|  │  [אזור הגשה - טקסט/קובץ/תמונה]     │  |
|  │                                    │  |
|  │  [ 🚀 שלח משימה ]                  │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │  [ חזרה לשיעור ]                   │  |
|  └────────────────────────────────────┘  |
+------------------------------------------+
```

---

## פופאפים לאחר הגשה

### אם אושר:
```text
+----------------------------------+
|     ✅ המשימה אושרה!              |
|                                  |
|  כל הכבוד! המשימה שלך אושרה       |
|  ותוכל להמשיך לשיעור הבא.        |
|                                  |
|     [ חזרה לשיעור ]              |
+----------------------------------+
```

### אם נדחה:
```text
+----------------------------------+
|     ❌ המשימה נדחתה               |
|                                  |
|  ההגשה לא עמדה בדרישות המשימה.    |
|  אנא קרא את ההוראות שוב ונסה      |
|  להגיש הגשה חדשה.                |
|                                  |
|     [ הגש שוב ]                  |
+----------------------------------+
```

---

## קבצים לעדכון/יצירה

| קובץ | פעולה | תיאור |
|------|-------|-------|
| `src/pages/TaskView.tsx` | **חדש** | דף משימה עצמאי |
| `src/App.tsx` | עדכון | הוספת route `/tasks/:taskId` |
| `src/pages/Tasks.tsx` | עדכון | שינוי ניווט ל-`/tasks/{taskId}` |
| `src/components/MandatoryTaskBlocker.tsx` | עדכון | ניווט ל-task page |
| `src/pages/LessonView.tsx` | עדכון | הסרת inline submission, הוספת link |
| `src/hooks/useTasksData.ts` | עדכון | הוספת `useTaskById` hook |

---

## לוגיקת חסימה מעודכנת

### בכניסה לשיעור עם משימת חובה לא מושלמת:

1. בדיקה אם יש משימה משויכת לשיעור
2. בדיקה אם המשימה היא חובה (`is_mandatory = true`)
3. בדיקה אם יש הגשה מאושרת למשתמש הנוכחי
4. אם לא - הצגת `MandatoryTaskBlocker` עם:
   - הודעה: "כדי להמשיך בשיעור זה, יש להשלים את המשימה המצורפת"
   - כפתור: "מעבר למשימה" → `/tasks/{taskId}`
5. תוכן השיעור מטושטש ולא אינטראקטיבי

### בדף המשימה לאחר אישור:
1. הצגת popup הצלחה
2. כפתור "חזרה לשיעור" → `/lesson/{lessonId}`
3. השיעור כעת נגיש לחלוטין

---

## פרטים טכניים

### Hook חדש: `useTaskById`

```typescript
export const useTaskById = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_tasks')
        .select(`
          *,
          lessons!inner (
            id,
            title,
            chapter_id,
            chapters!inner (
              id,
              title,
              module_id,
              modules!inner (
                id,
                title
              )
            )
          )
        `)
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
};
```

### עדכון Props של MandatoryTaskBlocker

```typescript
interface MandatoryTaskBlockerProps {
  isBlocked: boolean;
  taskId?: string;           // ID של המשימה עצמה
  taskLessonId?: string;     // ID השיעור המקושר
  taskLessonTitle?: string;
  isCurrentLessonTask?: boolean;
}
```

### TaskView - מבנה הרכיב

```typescript
const TaskView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const { data: task } = useTaskById(taskId!);
  const { data: submission } = useUserTaskSubmission(taskId!);
  
  // States for submission
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Show success/rejection dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  
  // Watch for status changes
  useEffect(() => {
    if (effectiveStatus === 'approved') {
      setShowSuccessDialog(true);
    } else if (effectiveStatus === 'rejected') {
      setShowRejectedDialog(true);
    }
  }, [effectiveStatus]);
  
  return (
    <AuthGuard>
      {/* Breadcrumb */}
      {/* Task Card with instructions */}
      {/* Status Badge */}
      {/* Submission Form */}
      {/* Success Dialog */}
      {/* Rejection Dialog */}
    </AuthGuard>
  );
};
```

---

## בדיקות לאחר יישום

| בדיקה | תוצאה צפויה |
|-------|-------------|
| כניסה ל-`/tasks` | רשימת משימות מקובצת לפי קורס |
| לחיצה על משימה | ניווט ל-`/tasks/{taskId}` |
| הגשת משימה בדף משימה | נשמרת ב-DB, מופעל AI validation |
| אישור AI | popup הצלחה, כפתור "חזרה לשיעור" |
| דחיית AI | popup דחייה, אפשרות הגשה מחדש |
| כניסה לשיעור עם משימת חובה לא מושלמת | popup חסימה עם כפתור "מעבר למשימה" |
| לחיצה על "מעבר למשימה" | ניווט ל-`/tasks/{taskId}` |
| לאחר אישור - כניסה לשיעור | תוכן נגיש לחלוטין, ללא חסימה |

---

## מה לא משתנה

- טבלאות DB (`lesson_tasks`, `task_submissions`)
- Edge function `validate-task`
- Admin panel task creation
- לוגיקת AI validation
- RLS policies
