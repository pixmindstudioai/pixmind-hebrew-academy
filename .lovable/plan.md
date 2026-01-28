
# תוכנית תיקון שני באגים קריטיים

## סקירת הבעיות

### באג #1: יצירת תיקיות חומרי לימוד נכשלת
**שורש הבעיה**: מדיניות RLS משתמשת ב-`is_admin()` שתלוי ב-`auth.uid()` מ-Supabase Auth. אבל מערכת האדמין משתמשת ב-localStorage ולא ב-Supabase Auth, כך ש-`auth.uid()` מחזיר `NULL` ו-RLS חוסם את הפעולה.

### באג #2: גרירת פרקים זורקת שגיאת UNIQUE constraint
**שורש הבעיה**: הקוד הנוכחי משתמש ב-`Promise.all` לעדכון מספר פרקים במקביל. כשמחליפים order_index בין שני פרקים, נוצר מצב זמני שבו שני פרקים מנסים לקבל את אותו order_index, והאילוץ `UNIQUE(module_id, order_index)` נכשל.

---

## פתרון באג #1: תיקון RLS לתיקיות חומרים

### אסטרטגיה
במקום לשנות את מערכת ה-Auth, נשתמש באותו דפוס שעובד עבור טבלת `modules` - שימוש ב-`is_admin_user()` שמכיר גם את ה-placeholder UUID.

### מיגרציית DB נדרשת

```sql
-- עדכון מדיניות RLS עבור materials_folders
DROP POLICY IF EXISTS "Admins can select folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can insert folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.materials_folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.materials_folders;

CREATE POLICY "Admins can manage folders" ON public.materials_folders
  FOR ALL TO public
  USING (is_admin_user(auth.uid()) OR is_admin())
  WITH CHECK (is_admin_user(auth.uid()) OR is_admin());

-- אותו דבר עבור materials_files ו-materials_folder_access
```

### עדכון קוד: שיפור הודעות שגיאה

קובץ: `src/hooks/useMaterialsData.ts`

```typescript
export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from("materials_folders")
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.error("Folder creation error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials-folders"] });
      toast.success("התיקייה נוצרה בהצלחה");
    },
    onError: (error: any) => {
      console.error("Folder creation error:", error);
      // הודעה מפורטת לאדמין
      const errorCode = error?.code || "unknown";
      const errorMessage = error?.message || "שגיאה לא ידועה";
      toast.error(`שגיאה ביצירת התיקייה: [${errorCode}] ${errorMessage}`);
    },
  });
};
```

---

## פתרון באג #2: גרירת פרקים עם Postgres RPC

### אסטרטגיה
יצירת פונקציית RPC ב-Postgres שמבצעת את השינוי בטרנזקציה אחת, עם שלב ביניים של ערכי order_index גבוהים כדי למנוע התנגשויות.

### מיגרציית DB: יצירת פונקציית reorder_chapters

```sql
CREATE OR REPLACE FUNCTION public.reorder_chapters(
  p_module_id uuid,
  p_ordered_chapter_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chapter_id uuid;
  v_index int;
BEGIN
  -- וידוא שהמשתמש הוא אדמין
  IF NOT (is_admin_user(auth.uid()) OR is_admin()) THEN
    RAISE EXCEPTION 'Only admins can reorder chapters';
  END IF;

  -- וידוא שכל הפרקים שייכים למודול הנכון
  IF EXISTS (
    SELECT 1 FROM unnest(p_ordered_chapter_ids) AS cid
    WHERE NOT EXISTS (
      SELECT 1 FROM chapters 
      WHERE id = cid AND module_id = p_module_id
    )
  ) THEN
    RAISE EXCEPTION 'All chapter IDs must belong to the specified module';
  END IF;

  -- שלב 1: הקצאת ערכי order_index גבוהים זמניים
  v_index := 1;
  FOREACH v_chapter_id IN ARRAY p_ordered_chapter_ids
  LOOP
    UPDATE chapters
    SET order_index = 100000 + v_index
    WHERE id = v_chapter_id AND module_id = p_module_id;
    v_index := v_index + 1;
  END LOOP;

  -- שלב 2: נורמליזציה לערכים סופיים (0-based)
  v_index := 0;
  FOREACH v_chapter_id IN ARRAY p_ordered_chapter_ids
  LOOP
    UPDATE chapters
    SET order_index = v_index
    WHERE id = v_chapter_id AND module_id = p_module_id;
    v_index := v_index + 1;
  END LOOP;
END;
$$;
```

### עדכון קוד: שימוש ב-RPC במקום Promise.all

קובץ: `src/hooks/useAdminData.ts`

```typescript
export const useReorderChapters = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chapters: Array<{ id: string; order_index: number; module_id: string }>) => {
      const moduleId = chapters[0]?.module_id;
      if (!moduleId) throw new Error('No module ID provided');
      
      // מיון לפי order_index החדש כדי לקבל את הסדר הנכון
      const orderedIds = chapters
        .sort((a, b) => a.order_index - b.order_index)
        .map(c => c.id);
      
      // קריאה ל-RPC במקום עדכון ישיר
      const { error } = await supabase.rpc('reorder_chapters', {
        p_module_id: moduleId,
        p_ordered_chapter_ids: orderedIds
      });
      
      if (error) {
        console.error('Reorder RPC error:', error);
        throw new Error(error.message || 'שגיאה בשינוי הסדר');
      }
      
      return chapters;
    },
    // ... שאר הקוד נשאר אותו דבר (optimistic updates, rollback, etc.)
  });
};
```

---

## רשימת קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/migrations/xxx.sql` | מיגרציה חדשה עם תיקון RLS ופונקציית RPC |
| `src/hooks/useMaterialsData.ts` | שיפור הודעות שגיאה |
| `src/hooks/useAdminData.ts` | שימוש ב-RPC במקום Promise.all |

---

## סיכום טכני

```text
┌──────────────────────────────────────────────────────────────────┐
│  באג #1: יצירת תיקיות                                           │
├──────────────────────────────────────────────────────────────────┤
│  בעיה: is_admin() לא עובד כי אין Supabase session               │
│  פתרון: שימוש ב-is_admin_user() כמו בטבלת modules               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  באג #2: גרירת פרקים                                            │
├──────────────────────────────────────────────────────────────────┤
│  בעיה: Promise.all גורם להתנגשות order_index                    │
│  פתרון: Postgres RPC עם 2-phase update בטרנזקציה אחת            │
│                                                                  │
│  שלב 1: order_index = 100000 + i (ערכים גבוהים זמניים)          │
│  שלב 2: order_index = i (ערכים סופיים)                          │
└──────────────────────────────────────────────────────────────────┘
```

## בדיקות לאחר התיקון

| בדיקה | תוצאה צפויה |
|-------|-------------|
| יצירת תיקייה חדשה | הצלחה, Toast ירוק |
| גרירת פרק ראשון למיקום אחרון | הצלחה, אין שגיאת constraint |
| גרירה מהירה של מספר פרקים | הצלחה |
| רענון עמוד המשתמש | סדר פרקים מעודכן |
