
# תוכנית תיקון יצירת תיקיות חומרי לימוד

## סיבת השורש שזוהתה

**הבעיה המרכזית: מדיניות RLS חסרה את פסוקית `WITH CHECK`**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  מדיניות נוכחית (לא עובדת)                                          │
├─────────────────────────────────────────────────────────────────────┤
│  Policy: "Admins can manage folders"                                │
│  Command: ALL                                                        │
│  USING: is_admin()         ← קיים ✓                                 │
│  WITH CHECK: NULL          ← חסר! ⚠️                                │
└─────────────────────────────────────────────────────────────────────┘

   ↓ כאשר אדמין מנסה לבצע INSERT

   PostgreSQL: "אין WITH CHECK, לכן INSERT נחסם"
   
   → Toast: "שגיאה ביצירת התיקייה"
```

ב-PostgreSQL, כאשר משתמשים במדיניות `ALL`:
- **USING** - משמש ל-SELECT, UPDATE, DELETE (לבדוק שורות קיימות)
- **WITH CHECK** - משמש ל-INSERT, UPDATE (לאמת שורות חדשות)

ללא `WITH CHECK`, פעולות INSERT נדחות אוטומטית.

---

## השוואה לטבלאות עובדות

| טבלה | USING | WITH CHECK | עובד? |
|------|-------|------------|-------|
| `bundles` | ✓ | ✓ | ✓ |
| `announcements` | ✓ | ✓ | ✓ |
| `modules` | ✓ | ✓ | ✓ |
| `materials_folders` | ✓ | ✗ | ✗ |
| `materials_files` | ✓ | ✗ | ✗ |
| `materials_folder_access` | ✓ | ✗ | ✗ |

---

## תוכנית התיקון

### שלב 1: תיקון מדיניות RLS ב-Supabase

יש ליצור מיגרציה שמעדכנת את שלוש הטבלאות:

```sql
-- materials_folders
DROP POLICY IF EXISTS "Admins can manage folders" ON materials_folders;
CREATE POLICY "Admins can manage folders" ON materials_folders
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- materials_files
DROP POLICY IF EXISTS "Admins can manage files" ON materials_files;
CREATE POLICY "Admins can manage files" ON materials_files
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- materials_folder_access
DROP POLICY IF EXISTS "Admins can manage folder access" ON materials_folder_access;
CREATE POLICY "Admins can manage folder access" ON materials_folder_access
FOR ALL USING (is_admin()) WITH CHECK (is_admin());
```

### שלב 2: שיפור הודעות שגיאה בקוד

עדכון ה-hook `useCreateFolder` להציג פרטי שגיאה לאדמין:

```typescript
onError: (error: any) => {
  console.error("Folder creation error:", error);
  const errorMessage = error?.message || "שגיאה לא ידועה";
  toast.error(`שגיאה ביצירת התיקייה: ${errorMessage}`);
}
```

### שלב 3: אימות התיקון

1. אדמין מתחבר לממשק הניהול
2. לוחץ על "תיקייה חדשה"
3. מזין שם ותיאור
4. לוחץ "צור תיקייה"
5. צפי: Toast ירוק "התיקייה נוצרה בהצלחה"
6. התיקייה מופיעה ברשימה

---

## פרטים טכניים

### קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/migrations/xxx.sql` | מיגרציה חדשה לתיקון RLS |
| `src/hooks/useMaterialsData.ts` | שיפור הודעות שגיאה |

### מיגרציה מלאה

```sql
-- Fix RLS policies for materials tables
-- Problem: Missing WITH CHECK clause prevents INSERT operations

-- 1. materials_folders
DROP POLICY IF EXISTS "Admins can manage folders" ON public.materials_folders;
CREATE POLICY "Admins can manage folders" ON public.materials_folders
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- 2. materials_files
DROP POLICY IF EXISTS "Admins can manage files" ON public.materials_files;
CREATE POLICY "Admins can manage files" ON public.materials_files
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- 3. materials_folder_access
DROP POLICY IF EXISTS "Admins can manage folder access" ON public.materials_folder_access;
CREATE POLICY "Admins can manage folder access" ON public.materials_folder_access
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

## בדיקות לאחר התיקון

| בדיקה | תוצאה צפויה |
|-------|-------------|
| יצירת תיקייה חדשה | הצלחה + הודעה ירוקה |
| עריכת שם תיקייה | הצלחה |
| מחיקת תיקייה | הצלחה |
| העלאת קובץ לתיקייה | הצלחה |
| הגדרת הרשאות לתיקייה | הצלחה |
| משתמש רגיל מנסה ליצור תיקייה | נחסם (RLS) |
| משתמש רואה תיקיות שהוא רשום אליהן | הצלחה |

---

## סיכום

| פריט | סטטוס |
|------|-------|
| **סיבה שזוהתה** | חסר WITH CHECK במדיניות RLS |
| **תיקון נדרש** | מיגרציה + עדכון error handling |
| **זמן משוער** | 5 דקות |
| **סיכון** | נמוך (רק עדכון מדיניות) |
