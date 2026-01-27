

# תוכנית ניפוי שגיאות ותיקון מערכת המשימות

## סיבת השורש הסבירה ביותר

לאחר ניתוח מעמיק, זיהיתי את **הבעיה המרכזית**:

**השיעור שמקושר למשימה נמצא בסטטוס "draft" (טיוטה) ולא "active"**

```text
┌─────────────────────────────────────────────────────────────────┐
│  בסיס הנתונים - מצב נוכחי                                       │
├─────────────────────────────────────────────────────────────────┤
│  משימה: 6c275667-93a2-44d4-9842-c6a7757dd047                    │
│    └── is_active: true  ✓                                       │
│    └── lesson_id: 434e9506-1636-4b7e-a432-a0eb118165eb          │
│                                                                  │
│  שיעור: 434e9506-1636-4b7e-a432-a0eb118165eb                    │
│    └── status: "draft"  ⚠ זו הבעיה!                             │
│    └── פרק: KLING (status: active)                              │
│    └── קורס: החיים הטובים-ההכשרה המלאה! (status: active)        │
└─────────────────────────────────────────────────────────────────┘
```

ה-RLS Policy של טבלת `lessons` דורש:
```sql
status = 'active' AND chapter.status = 'active' AND module.status = 'active'
```

כאשר משתמש רגיל (לא אדמין) מנסה לגשת לשיעור בסטטוס "draft" - השיעור לא מוחזר מהשאילתה, ובגלל ה-`!inner` join בקוד, גם המשימה לא מוחזרת.

---

## 1. תרשים זרימת הנתונים הנדרשת

```text
┌──────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│   Admin Panel    │      │     Supabase      │      │   Tasks Page     │
│                  │      │                   │      │                  │
│ יצירת משימה ──────────> │  lesson_tasks     │ <─────── useUserTasks()│
│                  │      │        ↓          │      │                  │
│ סטטוס שיעור ────────────>│  lessons (active) │      │ הצגת משימות     │
│                  │      │        ↓          │      │                  │
│                  │      │  chapters         │      │                  │
│                  │      │        ↓          │      │                  │
│                  │      │  modules          │      │                  │
└──────────────────┘      └───────────────────┘      └──────────────────┘
```

### טבלאות מעורבות
| טבלה | תפקיד |
|------|-------|
| `lesson_tasks` | משימות ברמת שיעור |
| `task_submissions` | הגשות של משתמשים |
| `lessons` | שיעורים (חייב להיות active) |
| `chapters` | פרקים (חייב להיות active) |
| `modules` | קורסים (חייב להיות active) |
| `user_module_access` | גישת משתמש לקורסים |
| `user_bundle_access` | גישת משתמש לחבילות |

---

## 2. רשימת בדיקות Supabase

### 2.1 בדיקת מבנה הטבלאות

**lesson_tasks** - עמודות נדרשות:
- `id` (uuid, PK)
- `lesson_id` (uuid, FK to lessons)
- `instructions` (text)
- `is_mandatory` (boolean)
- `is_active` (boolean)
- `allowed_types` (text[])
- `created_at`, `updated_at`

**task_submissions** - עמודות נדרשות:
- `id` (uuid, PK)
- `task_id` (uuid, FK to lesson_tasks)
- `user_id` (uuid, nullable)
- `user_email` (text)
- `submission_type` (enum)
- `content_text` / `content_url`
- `ai_status` (enum: pending/approved/rejected)
- `manual_override`, `manual_status`

### 2.2 RLS Policies - מה חייב לקיים

**lesson_tasks:**
```sql
-- קיים ✓
SELECT: is_active = true
ALL (admin): is_admin()
```

**task_submissions:**
```sql
-- נדרש לוודא
SELECT: user_email = current_user_email OR is_admin()
INSERT: user_email = current_user_email
UPDATE: is_admin() (for manual override)
```

### 2.3 סינון לפי הרשמה

השאילתה בקוד (`useUserTasks`) כבר מטפלת נכון:
1. טוענת את `user_module_access` לפי email
2. טוענת את `user_bundle_access` לפי email
3. מחשבת `bundle_modules` עבור bundles
4. מסננת משימות לפי גישה למודול

**הבעיה:** אם השיעור בסטטוס draft - הוא לא מוחזר כלל מה-JOIN.

---

## 3. לוגיקת עמוד המשימות

### השאילתה הנוכחית (useUserTasks)

```typescript
const { data: tasks } = await supabase
  .from('lesson_tasks')
  .select(`
    *,
    lessons!inner (...)  // בעייתי! inner join לא יחזיר draft
  `)
  .eq('is_active', true);
```

### מה קורה כרגע

1. המשתמש נכנס לעמוד `/tasks`
2. הקוד מבקש משימות עם `is_active = true` ✓
3. ה-JOIN ל-`lessons` עם RLS מסנן שיעורים שלא active ✗
4. התוצאה: מערך ריק (לא שגיאה)
5. העמוד מציג "אין משימות עדיין"

### מה צריך לקרות

1. השיעור חייב להיות בסטטוס `active` כדי שהמשימה תופיע
2. **זו התנהגות נכונה** - משימה על שיעור שלא פורסם לא צריכה להופיע

---

## 4. תוכנית ניפוי השגיאות

### שלב 1: אימות סטטוס השיעור

```sql
-- בדוק את סטטוס השיעור המקושר למשימה
SELECT l.id, l.title, l.status, lt.id as task_id
FROM lessons l
JOIN lesson_tasks lt ON l.id = lt.lesson_id
WHERE lt.is_active = true;
```

**צפי:** השיעור יהיה בסטטוס `draft`

### שלב 2: הפעלת השיעור

הפתרון: **לשנות את סטטוס השיעור ל-`active`** בממשק הניהול.

```text
Admin → Content → Module → Chapter → Lesson → Status: Active
```

### שלב 3: אימות ה-JOIN

בדוק שהשאילתה מחזירה תוצאות אחרי שהשיעור active:

```sql
SELECT lt.*, l.title, l.status
FROM lesson_tasks lt
INNER JOIN lessons l ON lt.lesson_id = l.id
WHERE lt.is_active = true AND l.status = 'active';
```

### שלב 4: בדיקת גישת משתמש

```sql
-- בדוק שלמשתמש יש גישה למודול
SELECT *
FROM user_module_access
WHERE user_email = 'email@example.com'
AND module_id = '4e5ec6cc-2a9a-45ff-bd06-dd8bb63dd5bb';
```

### שלב 5: בדיקות קונסול

- פתח את Developer Tools בדפדפן
- עבור לטאב Network
- רענן את עמוד `/tasks`
- בדוק את הבקשה ל-Supabase
- וודא שאין שגיאת 401/403 (RLS)

---

## 5. שלבי אימות סופיים

### בדיקה 1: יצירת משימה שתופיע

1. ב-Admin → Content, בחר שיעור **שכבר בסטטוס active**
2. הוסף משימה לשיעור הזה
3. וודא שהמשימה `is_active = true`

### בדיקה 2: רענון עמוד המשימות

1. התחבר כמשתמש (לא אדמין)
2. וודא שלמשתמש יש גישה לקורס (user_module_access או bundle)
3. עבור ל-`/tasks`
4. וודא שהמשימה מופיעה

### בדיקה 3: משתמש ללא גישה

1. התחבר כמשתמש ללא גישה לקורס
2. עבור ל-`/tasks`
3. וודא שהמשימה **לא** מופיעה (תוצאה צפויה)

### בדיקה 4: הגשה ואימות AI

1. כמשתמש עם גישה, לחץ על "עבור לשיעור"
2. הגש את המשימה
3. וודא שהסטטוס משתנה ל"בבדיקה"
4. בדוק שה-AI מחזיר approved/rejected

---

## סיכום הפעולות הנדרשות

| # | פעולה | סוג | עדיפות |
|---|-------|-----|--------|
| 1 | שנה סטטוס השיעור ל-active | Admin UI | קריטי |
| 2 | וודא RLS על task_submissions | Database | קריטי |
| 3 | בדוק שהמשתמש רשום לקורס | Database | קריטי |
| 4 | בדוק Edge Function validate-task פרוסה | Supabase | חשוב |
| 5 | אופציונלי: הוסף הודעת שגיאה ברורה יותר | Code | משני |

---

## אפשרות נוספת: התאמת הקוד

אם רוצים להציג משימות גם על שיעורים בסטטוס draft (רק לאדמין), אפשר להוסיף לוגיקה נפרדת. אבל זו **לא הבעיה העיקרית** - המערכת עובדת נכון, פשוט השיעור לא פורסם.

