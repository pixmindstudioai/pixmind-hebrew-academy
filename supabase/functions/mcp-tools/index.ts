import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Create service role client for admin operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============= PERMISSION LAYER =============

interface AuthContext {
  userEmail: string;
  userId: string;
  role: "student" | "admin";
}

async function verifyAuth(authHeader: string | null): Promise<AuthContext> {
  if (!authHeader) {
    throw new Error("אימות נדרש");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("טוקן אימות לא תקין");
  }

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  return {
    userEmail: user.email!,
    userId: user.id,
    role: roleData ? "admin" : "student",
  };
}

async function requireRole(ctx: AuthContext, requiredRole: "admin"): Promise<void> {
  if (ctx.role !== requiredRole) {
    throw new Error("אין לך הרשאה לבצע פעולה זו");
  }
}

async function checkModuleAccess(userEmail: string, moduleId: string): Promise<boolean> {
  // Check user_module_access
  const { data: access } = await supabaseAdmin
    .from("user_module_access")
    .select("id")
    .eq("user_email", userEmail.toLowerCase())
    .eq("module_id", moduleId)
    .or("expires_at.is.null,expires_at.gt.now()")
    .single();

  if (access) return true;

  // Check if module is free
  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("is_paid, is_hidden")
    .eq("id", moduleId)
    .single();

  if (module && !module.is_paid && !module.is_hidden) return true;

  return false;
}

async function requireLessonAccess(ctx: AuthContext, lessonId: string): Promise<{ lesson: any; module: any; chapter: any }> {
  // Fetch lesson with chapter and module
  const { data: lesson, error } = await supabaseAdmin
    .from("lessons")
    .select(`
      *,
      chapters!inner (
        id, title, module_id, visibility_mode, cohort_id,
        modules!inner (id, title, is_paid, is_hidden)
      )
    `)
    .eq("id", lessonId)
    .single();

  if (error || !lesson) {
    throw new Error("שיעור לא נמצא");
  }

  const chapter = lesson.chapters;
  const module = chapter.modules;

  // Admin bypass
  if (ctx.role === "admin") {
    return { lesson, module, chapter };
  }

  // Check module access
  const hasAccess = await checkModuleAccess(ctx.userEmail, module.id);
  if (!hasAccess) {
    throw new Error("אין לך גישה למודול זה");
  }

  // Check cohort visibility for chapter
  if (chapter.visibility_mode === "cohort" && chapter.cohort_id) {
    const { data: cohortMembership } = await supabaseAdmin
      .from("cohort_students")
      .select("id")
      .eq("cohort_id", chapter.cohort_id)
      .or(`user_id.eq.${ctx.userId},email.ilike.${ctx.userEmail.toLowerCase()}`)
      .in("status", ["active", "invited"])
      .single();

    if (!cohortMembership) {
      throw new Error("הפרק לא זמין למחזור שלך");
    }
  }

  // Check cohort visibility for lesson
  if (lesson.visibility_mode === "cohort" && lesson.cohort_id) {
    const { data: cohortMembership } = await supabaseAdmin
      .from("cohort_students")
      .select("id")
      .eq("cohort_id", lesson.cohort_id)
      .or(`user_id.eq.${ctx.userId},email.ilike.${ctx.userEmail.toLowerCase()}`)
      .in("status", ["active", "invited"])
      .single();

    if (!cohortMembership) {
      throw new Error("השיעור לא זמין למחזור שלך");
    }
  }

  return { lesson, module, chapter };
}

// ============= AI HELPER =============

async function callAI(systemPrompt: string, userPrompt: string, language: string = "he"): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY לא מוגדר");
  }

  const langInstruction = language === "he" 
    ? "ענה בעברית בלבד." 
    : "Answer in English only.";

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `${systemPrompt}\n\n${langInstruction}` },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("הגעת למגבלת הבקשות. נסה שוב מאוחר יותר.");
    }
    if (response.status === 402) {
      throw new Error("נדרש תשלום. אנא פנה למנהל המערכת.");
    }
    throw new Error("שגיאה בשירות ה-AI");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============= LOGGING =============

async function logToolUsage(
  toolName: string,
  ctx: AuthContext,
  moduleId: string | null,
  lessonId: string | null,
  status: "success" | "error",
  errorMessage?: string,
  executionTimeMs?: number
): Promise<void> {
  try {
    await supabaseAdmin.from("tool_usage_logs").insert({
      tool_name: toolName,
      actor_email: ctx.userEmail,
      actor_role: ctx.role,
      module_id: moduleId,
      lesson_id: lessonId,
      status,
      error_message: errorMessage,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("Failed to log tool usage:", e);
  }
}

// ============= STUDENT TOOLS =============

async function summarizeLesson(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, length = "medium", language = "he" } = params;
  const { lesson, module, chapter } = await requireLessonAccess(ctx, lessonId);

  const lengthMap: Record<string, string> = {
    short: "סכם ב-2-3 משפטים קצרים",
    medium: "סכם ב-5-7 משפטים עם נקודות מפתח",
    long: "ספק סיכום מקיף עם הסברים מפורטים",
  };

  const result = await callAI(
    `אתה מורה מומחה. ${lengthMap[length] || lengthMap.medium}`,
    `סכם את השיעור הבא:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}
מהמודול: ${module.title}
מהפרק: ${chapter.title}`,
    language
  );

  return {
    summary: result,
    lessonTitle: lesson.title,
    moduleTitle: module.title,
    length,
  };
}

async function explainConcept(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, concept, language = "he" } = params;
  const { lesson, module } = await requireLessonAccess(ctx, lessonId);

  const result = await callAI(
    "אתה מורה מומחה שמסביר מושגים בצורה ברורה עם דוגמאות מעשיות.",
    `הסבר את המושג "${concept}" בהקשר של השיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  return { explanation: result, concept, lessonTitle: lesson.title };
}

async function extractKeyTakeaways(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, language = "he" } = params;
  const { lesson, module } = await requireLessonAccess(ctx, lessonId);

  const result = await callAI(
    "אתה מורה מומחה. חלץ את נקודות המפתח החשובות ביותר מהשיעור. ציין גם צעדים מעשיים ליישום.",
    `חלץ נקודות מפתח מהשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  return { takeaways: result, lessonTitle: lesson.title };
}

async function generateExamples(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, topic, level = "intermediate", language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const levelMap: Record<string, string> = {
    beginner: "דוגמאות פשוטות לתחילת הדרך",
    intermediate: "דוגמאות ברמה בינונית",
    advanced: "דוגמאות מתקדמות ומורכבות",
  };

  const result = await callAI(
    `אתה מורה מומחה. צור ${levelMap[level] || levelMap.intermediate} הקשורות לנושא.`,
    `צור דוגמאות מעשיות ${topic ? `לנושא: ${topic}` : ""} מתוך השיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  return { examples: result, level, lessonTitle: lesson.title };
}

async function createFlashcards(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, count = 10, language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const numCards = Math.min(Math.max(count, 5), 30);

  const result = await callAI(
    `אתה מורה מומחה. צור בדיוק ${numCards} כרטיסיות לימוד בפורמט JSON. כל כרטיסייה צריכה להיות אובייקט עם שדות "front" (שאלה) ו-"back" (תשובה). החזר מערך JSON בלבד ללא טקסט נוסף.`,
    `צור כרטיסיות לימוד מהשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  let flashcards;
  try {
    // Try to parse JSON from the result
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    flashcards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    flashcards = [{ front: "שגיאה ביצירת כרטיסיות", back: result }];
  }

  return { flashcards, count: flashcards.length, lessonTitle: lesson.title };
}

async function generateQuiz(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, numQuestions = 5, difficulty = "medium", language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const numQ = Math.min(Math.max(numQuestions, 3), 20);
  const difficultyMap: Record<string, string> = {
    easy: "שאלות פשוטות להבנה בסיסית",
    medium: "שאלות ברמה בינונית עם חשיבה",
    hard: "שאלות מאתגרות שדורשות הבנה עמוקה",
  };

  const result = await callAI(
    `אתה מורה מומחה. צור בדיוק ${numQ} שאלות חידון (${difficultyMap[difficulty] || difficultyMap.medium}). 
פורמט JSON: מערך של אובייקטים, כל אחד עם: "question", "options" (מערך של 4 אפשרויות), "correctIndex" (0-3), "explanation".
החזר JSON בלבד.`,
    `צור חידון מהשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  let quiz;
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    quiz = [];
  }

  return { quiz, difficulty, count: quiz.length, lessonTitle: lesson.title };
}

async function checkUnderstanding(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, language = "he", userAnswers } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  if (userAnswers && Array.isArray(userAnswers)) {
    // Provide feedback on answers
    const result = await callAI(
      "אתה מורה מומחה. בדוק את התשובות ותן משוב מפורט על כל תשובה - האם נכונה, מה חסר, והסבר נוסף אם צריך.",
      `בדוק את התשובות הבאות לשיעור "${lesson.title}":
${JSON.stringify(userAnswers, null, 2)}`,
      language
    );
    return { feedback: result, lessonTitle: lesson.title };
  }

  // Generate check questions
  const result = await callAI(
    "אתה מורה מומחה. צור 3-5 שאלות בדיקת הבנה קצרות שיעזרו לתלמיד לבדוק שהוא הבין את החומר.",
    `צור שאלות בדיקת הבנה לשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}`,
    language
  );

  return { checkQuestions: result, lessonTitle: lesson.title };
}

async function lessonActionPlan(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, horizonHours = 24, language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const horizonMap: Record<number, string> = {
    6: "ב-6 השעות הקרובות",
    24: "ביום הקרוב",
    48: "ביומיים הקרובים",
    72: "בשלושת הימים הקרובים",
  };

  const result = await callAI(
    `אתה מורה מומחה. צור תוכנית פעולה מעשית ליישום תוכן השיעור ${horizonMap[horizonHours] || horizonMap[24]}. 
כלול: משימות ספציפיות, נקודות ביקורת, ומדדי הצלחה.`,
    `צור תוכנית פעולה לשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}
${lesson.rich_text ? `תוכן: ${lesson.rich_text}` : ""}`,
    language
  );

  return { actionPlan: result, horizonHours, lessonTitle: lesson.title };
}

async function summarizeAttachment(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, attachmentId, attachmentUrl, language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  // Find attachment
  let attachment;
  if (attachmentId) {
    const { data } = await supabaseAdmin
      .from("lesson_attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("lesson_id", lessonId)
      .single();
    attachment = data;
  } else if (attachmentUrl && lesson.attachments) {
    attachment = (lesson.attachments as any[]).find((a: any) => a.url === attachmentUrl);
  }

  if (!attachment) {
    throw new Error("קובץ מצורף לא נמצא");
  }

  const result = await callAI(
    "אתה מורה מומחה. סכם את תוכן הקובץ המצורף על בסיס שמו, סוגו והקשר השיעור.",
    `סכם את הקובץ המצורף:
שם: ${attachment.name}
סוג: ${attachment.mime || attachment.type || "לא ידוע"}
שיעור: ${lesson.title}
תיאור השיעור: ${lesson.description}`,
    language
  );

  return { summary: result, attachmentName: attachment.name, lessonTitle: lesson.title };
}

async function extractLinksAndNotes(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const links = lesson.links || [];
  const attachments = lesson.attachments || [];

  return {
    links,
    attachments: (attachments as any[]).map((a: any) => ({
      name: a.name,
      url: a.url,
      type: a.type || a.mime,
    })),
    richText: lesson.rich_text,
    lessonTitle: lesson.title,
  };
}

async function myProgressOverview(ctx: AuthContext, params: any): Promise<any> {
  const { moduleId, language = "he" } = params;

  // Verify access
  if (ctx.role !== "admin") {
    const hasAccess = await checkModuleAccess(ctx.userEmail, moduleId);
    if (!hasAccess) {
      throw new Error("אין לך גישה למודול זה");
    }
  }

  // Get module info
  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("id, title")
    .eq("id", moduleId)
    .single();

  if (!module) {
    throw new Error("מודול לא נמצא");
  }

  // Get chapters and lessons
  const { data: chapters } = await supabaseAdmin
    .from("chapters")
    .select("id, title, order_index")
    .eq("module_id", moduleId)
    .eq("status", "active")
    .order("order_index");

  const { data: lessons } = await supabaseAdmin
    .from("lessons")
    .select("id, title, chapter_id")
    .in("chapter_id", (chapters || []).map((c) => c.id))
    .eq("status", "active");

  // Get user progress
  const { data: progress } = await supabaseAdmin
    .from("user_progress")
    .select("lesson_id, completed")
    .eq("user_id", ctx.userId)
    .in("lesson_id", (lessons || []).map((l) => l.id));

  const progressMap = new Map((progress || []).map((p) => [p.lesson_id, p.completed]));

  // Build overview
  const chaptersOverview = (chapters || []).map((chapter) => {
    const chapterLessons = (lessons || []).filter((l) => l.chapter_id === chapter.id);
    const completedLessons = chapterLessons.filter((l) => progressMap.get(l.id)).length;
    return {
      id: chapter.id,
      title: chapter.title,
      totalLessons: chapterLessons.length,
      completedLessons,
      percentage: chapterLessons.length > 0 ? Math.round((completedLessons / chapterLessons.length) * 100) : 0,
    };
  });

  const totalLessons = (lessons || []).length;
  const totalCompleted = (lessons || []).filter((l) => progressMap.get(l.id)).length;

  return {
    moduleTitle: module.title,
    totalLessons,
    totalCompleted,
    overallPercentage: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
    chapters: chaptersOverview,
  };
}

async function recommendNextLesson(ctx: AuthContext, params: any): Promise<any> {
  const { moduleId, language = "he" } = params;

  // Verify access
  if (ctx.role !== "admin") {
    const hasAccess = await checkModuleAccess(ctx.userEmail, moduleId);
    if (!hasAccess) {
      throw new Error("אין לך גישה למודול זה");
    }
  }

  // Get chapters
  const { data: chapters } = await supabaseAdmin
    .from("chapters")
    .select("id, title, order_index")
    .eq("module_id", moduleId)
    .eq("status", "active")
    .order("order_index");

  // Get lessons
  const { data: lessons } = await supabaseAdmin
    .from("lessons")
    .select("id, title, chapter_id, order_index")
    .in("chapter_id", (chapters || []).map((c) => c.id))
    .eq("status", "active")
    .order("order_index");

  // Get user progress
  const { data: progress } = await supabaseAdmin
    .from("user_progress")
    .select("lesson_id, completed")
    .eq("user_id", ctx.userId)
    .eq("completed", true)
    .in("lesson_id", (lessons || []).map((l) => l.id));

  const completedSet = new Set((progress || []).map((p) => p.lesson_id));

  // Find first incomplete lesson
  const sortedLessons = (lessons || []).sort((a, b) => {
    const chapterA = (chapters || []).find((c) => c.id === a.chapter_id);
    const chapterB = (chapters || []).find((c) => c.id === b.chapter_id);
    if (chapterA!.order_index !== chapterB!.order_index) {
      return chapterA!.order_index - chapterB!.order_index;
    }
    return a.order_index - b.order_index;
  });

  const nextLesson = sortedLessons.find((l) => !completedSet.has(l.id));

  if (!nextLesson) {
    return { message: language === "he" ? "סיימת את כל השיעורים במודול! 🎉" : "You've completed all lessons! 🎉" };
  }

  const chapter = (chapters || []).find((c) => c.id === nextLesson.chapter_id);

  return {
    lessonId: nextLesson.id,
    lessonTitle: nextLesson.title,
    chapterTitle: chapter?.title,
    reason: language === "he" ? "השיעור הבא בסדר הלימוד" : "Next lesson in sequence",
  };
}

async function setLearningGoal(ctx: AuthContext, params: any): Promise<any> {
  const { weeklyTargetLessons, preferredDays, reminderMode } = params;

  // Store in user preferences (using users table preferences column)
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      preferences: {
        learningGoal: {
          weeklyTargetLessons,
          preferredDays,
          reminderMode,
          updatedAt: new Date().toISOString(),
        },
      },
    })
    .eq("id", ctx.userId);

  if (error) {
    throw new Error("שגיאה בשמירת היעד");
  }

  return {
    success: true,
    weeklyTargetLessons,
    preferredDays,
    reminderMode,
  };
}

async function draftComment(ctx: AuthContext, params: any): Promise<any> {
  const { lessonId, intent = "question", language = "he" } = params;
  const { lesson } = await requireLessonAccess(ctx, lessonId);

  const intentMap: Record<string, string> = {
    question: "שאלה על החומר",
    insight: "תובנה או רעיון",
    feedback: "משוב על השיעור",
  };

  const result = await callAI(
    `אתה עוזר לכתוב ${intentMap[intent] || "תגובה"} לשיעור. כתוב טיוטה מנומסת ומועילה.`,
    `כתוב טיוטת ${intentMap[intent]} לשיעור:
כותרת: ${lesson.title}
תיאור: ${lesson.description}`,
    language
  );

  return { draft: result, intent, lessonTitle: lesson.title };
}

async function rephraseComment(ctx: AuthContext, params: any): Promise<any> {
  const { text, style = "clear", language = "he" } = params;

  const styleMap: Record<string, string> = {
    short: "נסח מחדש בקצרה",
    professional: "נסח מחדש בסגנון מקצועי",
    friendly: "נסח מחדש בסגנון ידידותי",
    clear: "נסח מחדש בצורה ברורה ופשוטה",
  };

  const result = await callAI(
    `${styleMap[style] || styleMap.clear}. שמור על המשמעות המקורית.`,
    `נסח מחדש: ${text}`,
    language
  );

  return { rephrased: result, originalText: text, style };
}

async function reportIssue(ctx: AuthContext, params: any): Promise<any> {
  const { category, lessonId, moduleId, message } = params;

  const { data, error } = await supabaseAdmin.from("crm_messages").insert({
    user_email: ctx.userEmail,
    user_id: ctx.userId,
    message_type: category === "payment" ? "purchase" : "support",
    message_text: message,
    related_lesson_id: lessonId || null,
    related_module_id: moduleId || null,
    tags: [category],
    status: "new",
  }).select("id").single();

  if (error) {
    throw new Error("שגיאה ביצירת הפנייה");
  }

  return { ticketId: data.id, category, message: "הפנייה נוצרה בהצלחה" };
}

// ============= ADMIN TOOLS =============

async function adminCreateModule(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { title, description, is_hidden, regular_price, sale_price, sale_active, sale_start_date, sale_end_date, payment_url, thumbnail_url } = params;

  const { data, error } = await supabaseAdmin.from("modules").insert({
    title,
    description,
    is_hidden: is_hidden || false,
    is_paid: (regular_price || 0) > 0,
    regular_price,
    sale_price,
    sale_active,
    sale_start_date,
    sale_end_date,
    payment_url,
    thumbnail_url,
    created_by: ctx.userId,
    status: "draft",
  }).select("id, title").single();

  if (error) {
    throw new Error(`שגיאה ביצירת מודול: ${error.message}`);
  }

  return { moduleId: data.id, title: data.title, message: "המודול נוצר בהצלחה" };
}

async function adminUpdateModule(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId, ...updates } = params;

  const { data, error } = await supabaseAdmin
    .from("modules")
    .update(updates)
    .eq("id", moduleId)
    .select()
    .single();

  if (error) {
    throw new Error(`שגיאה בעדכון מודול: ${error.message}`);
  }

  return { module: data, message: "המודול עודכן בהצלחה" };
}

async function adminCreateChapter(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId, title, orderIndex, visibilityMode = "all", cohortId } = params;

  const { data, error } = await supabaseAdmin.from("chapters").insert({
    module_id: moduleId,
    title,
    order_index: orderIndex || 0,
    visibility_mode: visibilityMode,
    cohort_id: visibilityMode === "cohort" ? cohortId : null,
    status: "draft",
  }).select("id, title").single();

  if (error) {
    throw new Error(`שגיאה ביצירת פרק: ${error.message}`);
  }

  return { chapterId: data.id, title: data.title, message: "הפרק נוצר בהצלחה" };
}

async function adminCreateLesson(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { chapterId, title, orderIndex, videoUrl, attachments, links, notes } = params;

  const { data, error } = await supabaseAdmin.from("lessons").insert({
    chapter_id: chapterId,
    title,
    description: notes || "",
    order_index: orderIndex || 0,
    video_url: videoUrl,
    attachments: attachments || [],
    links: links || [],
    rich_text: notes,
    status: "draft",
  }).select("id, title").single();

  if (error) {
    throw new Error(`שגיאה ביצירת שיעור: ${error.message}`);
  }

  return { lessonId: data.id, title: data.title, message: "השיעור נוצר בהצלחה" };
}

async function adminBulkPublish(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId, actions } = params;
  const results: any[] = [];

  for (const action of actions) {
    if (action.type === "publish_chapter") {
      const { error } = await supabaseAdmin
        .from("chapters")
        .update({ status: "active", published_at: new Date().toISOString() })
        .eq("id", action.chapterId);
      results.push({ type: "chapter", id: action.chapterId, success: !error });
    } else if (action.type === "publish_lesson") {
      const { error } = await supabaseAdmin
        .from("lessons")
        .update({ status: "active", published_at: new Date().toISOString() })
        .eq("id", action.lessonId);
      results.push({ type: "lesson", id: action.lessonId, success: !error });
    }
  }

  return { results, message: "פעולות בוצעו" };
}

async function adminContentAudit(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId } = params;
  const issues: any[] = [];

  // Get modules
  const moduleQuery = supabaseAdmin.from("modules").select("*");
  if (moduleId) moduleQuery.eq("id", moduleId);
  const { data: modules } = await moduleQuery;

  for (const module of modules || []) {
    // Get chapters
    const { data: chapters } = await supabaseAdmin
      .from("chapters")
      .select("*")
      .eq("module_id", module.id);

    if (!chapters || chapters.length === 0) {
      issues.push({ type: "empty_module", moduleId: module.id, moduleTitle: module.title });
    }

    for (const chapter of chapters || []) {
      // Get lessons
      const { data: lessons } = await supabaseAdmin
        .from("lessons")
        .select("*")
        .eq("chapter_id", chapter.id);

      if (!lessons || lessons.length === 0) {
        issues.push({ type: "empty_chapter", chapterId: chapter.id, chapterTitle: chapter.title });
      }

      for (const lesson of lessons || []) {
        if (!lesson.video_url) {
          issues.push({ type: "missing_video", lessonId: lesson.id, lessonTitle: lesson.title });
        }
        if (!lesson.description || lesson.description.length < 10) {
          issues.push({ type: "missing_description", lessonId: lesson.id, lessonTitle: lesson.title });
        }
      }
    }
  }

  return { issues, totalIssues: issues.length };
}

async function adminListComments(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId, lessonId, userEmail, status, dateRange, search, limit = 50 } = params;

  let query = supabaseAdmin
    .from("comments")
    .select(`
      *,
      users!inner (full_name, email, profile_picture_url),
      lessons!inner (title, chapters!inner (title, modules!inner (title, id)))
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (lessonId) query = query.eq("lesson_id", lessonId);
  if (status) query = query.eq("status", status);
  if (userEmail) query = query.ilike("users.email", `%${userEmail}%`);
  if (search) query = query.ilike("content", `%${search}%`);
  if (dateRange?.start) query = query.gte("created_at", dateRange.start);
  if (dateRange?.end) query = query.lte("created_at", dateRange.end);

  const { data, error } = await query;

  if (error) {
    throw new Error(`שגיאה בטעינת תגובות: ${error.message}`);
  }

  // Filter by moduleId if provided (post-query filter due to nested join)
  let filteredData = data || [];
  if (moduleId) {
    filteredData = filteredData.filter((c: any) => c.lessons?.chapters?.modules?.id === moduleId);
  }

  return { comments: filteredData, total: filteredData.length };
}

async function adminModerateComment(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { commentId, action, newText, reason } = params;

  let updateData: any = {};
  if (action === "approve") updateData.status = "approved";
  else if (action === "hide") updateData.status = "hidden";
  else if (action === "delete") {
    const { error } = await supabaseAdmin.from("comments").delete().eq("id", commentId);
    if (error) throw new Error(`שגיאה במחיקת תגובה: ${error.message}`);
    return { success: true, action: "deleted" };
  } else if (action === "edit" && newText) {
    updateData.content = newText;
  }

  const { error } = await supabaseAdmin.from("comments").update(updateData).eq("id", commentId);
  if (error) throw new Error(`שגיאה בעדכון תגובה: ${error.message}`);

  // Log moderation action
  await supabaseAdmin.from("moderation_actions").insert({
    comment_id: commentId,
    moderator_id: ctx.userId,
    action,
    reason,
  });

  return { success: true, action };
}

async function adminCommentInsights(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { moduleId, dateRange } = params;

  let query = supabaseAdmin
    .from("comments")
    .select("lesson_id, created_at, status");

  if (dateRange?.start) query = query.gte("created_at", dateRange.start);
  if (dateRange?.end) query = query.lte("created_at", dateRange.end);

  const { data: comments } = await query;

  // Group by lesson
  const lessonCounts = (comments || []).reduce((acc: any, c: any) => {
    acc[c.lesson_id] = (acc[c.lesson_id] || 0) + 1;
    return acc;
  }, {});

  const topLessons = Object.entries(lessonCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  // Get lesson titles
  const { data: lessons } = await supabaseAdmin
    .from("lessons")
    .select("id, title")
    .in("id", topLessons.map(([id]) => id));

  const lessonMap = new Map((lessons || []).map((l) => [l.id, l.title]));

  return {
    totalComments: (comments || []).length,
    topLessons: topLessons.map(([id, count]) => ({
      lessonId: id,
      lessonTitle: lessonMap.get(id) || "לא ידוע",
      count,
    })),
    statusBreakdown: (comments || []).reduce((acc: any, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}),
  };
}

async function adminFindUser(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { query } = params;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,id.eq.${query}`)
    .limit(20);

  if (error) throw new Error(`שגיאה בחיפוש: ${error.message}`);

  return { users: data || [] };
}

async function adminGrantAccess(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail, moduleId, expiresAt, notes } = params;

  const { error } = await supabaseAdmin
    .from("user_module_access")
    .upsert({
      user_email: userEmail.toLowerCase(),
      module_id: moduleId,
      expires_at: expiresAt || null,
      notes,
      granted_by: ctx.userEmail,
      provider: "manual",
    }, { onConflict: "user_email,module_id" });

  if (error) throw new Error(`שגיאה בהענקת גישה: ${error.message}`);

  return { success: true, userEmail, moduleId };
}

async function adminRevokeAccess(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail, moduleId } = params;

  const { error } = await supabaseAdmin
    .from("user_module_access")
    .delete()
    .eq("user_email", userEmail.toLowerCase())
    .eq("module_id", moduleId);

  if (error) throw new Error(`שגיאה בביטול גישה: ${error.message}`);

  return { success: true, userEmail, moduleId };
}

async function adminSetCohort(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail, cohortId, action, fromCohortId } = params;

  if (action === "add") {
    const { error } = await supabaseAdmin.from("cohort_students").insert({
      cohort_id: cohortId,
      email: userEmail.toLowerCase(),
      status: "active",
    });
    if (error) throw new Error(`שגיאה בהוספה למחזור: ${error.message}`);
  } else if (action === "remove") {
    const { error } = await supabaseAdmin
      .from("cohort_students")
      .delete()
      .eq("cohort_id", cohortId)
      .eq("email", userEmail.toLowerCase());
    if (error) throw new Error(`שגיאה בהסרה ממחזור: ${error.message}`);
  } else if (action === "move" && fromCohortId) {
    await supabaseAdmin
      .from("cohort_students")
      .delete()
      .eq("cohort_id", fromCohortId)
      .eq("email", userEmail.toLowerCase());
    const { error } = await supabaseAdmin.from("cohort_students").insert({
      cohort_id: cohortId,
      email: userEmail.toLowerCase(),
      status: "active",
    });
    if (error) throw new Error(`שגיאה בהעברה בין מחזורים: ${error.message}`);
  }

  return { success: true, action, userEmail, cohortId };
}

async function adminUserProfileView(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail } = params;

  // Get user
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", userEmail.toLowerCase())
    .single();

  if (!user) throw new Error("משתמש לא נמצא");

  // Get access
  const { data: access } = await supabaseAdmin
    .from("user_module_access")
    .select("*, modules (title)")
    .eq("user_email", userEmail.toLowerCase());

  // Get purchases
  const { data: purchases } = await supabaseAdmin
    .from("purchases")
    .select("*, modules (title)")
    .eq("user_email", userEmail.toLowerCase());

  // Get progress
  const { data: progress } = await supabaseAdmin
    .from("user_progress")
    .select("*, lessons (title)")
    .eq("user_id", user.id);

  // Get comments
  const { data: comments } = await supabaseAdmin
    .from("comments")
    .select("*, lessons (title)")
    .eq("user_id", user.id)
    .limit(20);

  return {
    user,
    access: access || [],
    purchases: purchases || [],
    progress: progress || [],
    comments: comments || [],
  };
}

async function adminResetProgress(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail, moduleId, lessonId, chapterId } = params;

  // Get user
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", userEmail.toLowerCase())
    .single();

  if (!user) throw new Error("משתמש לא נמצא");

  if (lessonId) {
    await supabaseAdmin
      .from("user_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
  } else if (chapterId) {
    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id")
      .eq("chapter_id", chapterId);
    await supabaseAdmin
      .from("user_progress")
      .delete()
      .eq("user_id", user.id)
      .in("lesson_id", (lessons || []).map((l) => l.id));
  } else if (moduleId) {
    // Use RPC function
    await supabaseAdmin.rpc("reset_user_module_progress", {
      p_user_id: user.id,
      p_module_id: moduleId,
    });
  }

  return { success: true, userEmail };
}

async function adminListPurchases(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { userEmail, moduleId, dateRange, status, limit = 50 } = params;

  let query = supabaseAdmin
    .from("purchases")
    .select("*, modules (title)")
    .order("payment_date", { ascending: false })
    .limit(limit);

  if (userEmail) query = query.ilike("user_email", `%${userEmail}%`);
  if (moduleId) query = query.eq("module_id", moduleId);
  if (status) query = query.eq("status", status);
  if (dateRange?.start) query = query.gte("payment_date", dateRange.start);
  if (dateRange?.end) query = query.lte("payment_date", dateRange.end);

  const { data, error } = await query;
  if (error) throw new Error(`שגיאה בטעינת רכישות: ${error.message}`);

  return { purchases: data || [], total: (data || []).length };
}

async function adminReconcilePurchase(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { purchaseId, moduleId, notes } = params;

  // Get purchase
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (!purchase) throw new Error("רכישה לא נמצאה");

  // Update purchase with module
  await supabaseAdmin
    .from("purchases")
    .update({ module_id: moduleId })
    .eq("id", purchaseId);

  // Grant access
  await supabaseAdmin.from("user_module_access").upsert({
    user_email: purchase.user_email.toLowerCase(),
    module_id: moduleId,
    provider: purchase.provider,
    transaction_id: purchase.transaction_id,
    notes,
    granted_by: ctx.userEmail,
  }, { onConflict: "user_email,module_id" });

  return { success: true, purchaseId, moduleId };
}

async function adminTriggerWebhookTest(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { provider, payload } = params;

  // Log the test
  await supabaseAdmin.from("webhook_logs").insert({
    provider,
    payload,
    event_type: "test",
    processed: true,
  });

  return { success: true, message: "Webhook test logged" };
}

async function adminFixMissingAccess(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { dateRange } = params;

  // Find purchases without access
  let query = supabaseAdmin
    .from("purchases")
    .select("*")
    .not("module_id", "is", null);

  if (dateRange?.start) query = query.gte("payment_date", dateRange.start);
  if (dateRange?.end) query = query.lte("payment_date", dateRange.end);

  const { data: purchases } = await query;

  const fixed: any[] = [];
  for (const purchase of purchases || []) {
    // Check if access exists
    const { data: access } = await supabaseAdmin
      .from("user_module_access")
      .select("id")
      .eq("user_email", purchase.user_email.toLowerCase())
      .eq("module_id", purchase.module_id)
      .single();

    if (!access) {
      // Grant access
      await supabaseAdmin.from("user_module_access").insert({
        user_email: purchase.user_email.toLowerCase(),
        module_id: purchase.module_id,
        provider: purchase.provider,
        transaction_id: purchase.transaction_id,
        granted_by: "system-fix",
      });
      fixed.push({ purchaseId: purchase.id, userEmail: purchase.user_email });
    }
  }

  return { fixed, count: fixed.length };
}

async function adminCrmListTickets(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { status, tag, userEmail, dateRange, limit = 50 } = params;

  let query = supabaseAdmin
    .from("crm_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);
  if (userEmail) query = query.ilike("user_email", `%${userEmail}%`);
  if (dateRange?.start) query = query.gte("created_at", dateRange.start);
  if (dateRange?.end) query = query.lte("created_at", dateRange.end);

  const { data, error } = await query;
  if (error) throw new Error(`שגיאה בטעינת פניות: ${error.message}`);

  return { tickets: data || [], total: (data || []).length };
}

async function adminCrmUpdateTicket(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { ticketId, status, assignee, tags, adminNote } = params;

  const updateData: any = { updated_at: new Date().toISOString() };
  if (status) {
    updateData.status = status;
    if (status === "viewed") updateData.viewed_at = new Date().toISOString();
    if (status === "closed") updateData.closed_at = new Date().toISOString();
  }
  if (assignee) updateData.assigned_to = assignee;
  if (tags) updateData.tags = tags;
  if (adminNote) updateData.admin_notes = adminNote;

  const { error } = await supabaseAdmin
    .from("crm_messages")
    .update(updateData)
    .eq("id", ticketId);

  if (error) throw new Error(`שגיאה בעדכון פנייה: ${error.message}`);

  return { success: true, ticketId };
}

async function adminSystemHealth(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const health: any = { status: "ok", checks: [] };

  // Check tables exist
  const tables = ["modules", "chapters", "lessons", "users", "user_module_access"];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select("id").limit(1);
    health.checks.push({ table, ok: !error });
  }

  // Get counts
  const { count: moduleCount } = await supabaseAdmin.from("modules").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true });
  const { count: lessonCount } = await supabaseAdmin.from("lessons").select("*", { count: "exact", head: true });

  health.stats = { moduleCount, userCount, lessonCount };

  return health;
}

async function adminErrorLogs(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { dateRange, severity, limit = 100 } = params;

  let query = supabaseAdmin
    .from("webhook_logs")
    .select("*")
    .not("error_message", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (dateRange?.start) query = query.gte("created_at", dateRange.start);
  if (dateRange?.end) query = query.lte("created_at", dateRange.end);

  const { data } = await query;

  // Also get tool usage errors
  let toolQuery = supabaseAdmin
    .from("tool_usage_logs")
    .select("*")
    .eq("status", "error")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (dateRange?.start) toolQuery = toolQuery.gte("created_at", dateRange.start);
  if (dateRange?.end) toolQuery = toolQuery.lte("created_at", dateRange.end);

  const { data: toolErrors } = await toolQuery;

  return {
    webhookErrors: data || [],
    toolErrors: toolErrors || [],
  };
}

async function adminUsageStats(ctx: AuthContext, params: any): Promise<any> {
  await requireRole(ctx, "admin");

  const { dateRange } = params;

  // Active users (users who logged in recently)
  let userQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .not("last_login_at", "is", null);

  if (dateRange?.start) userQuery = userQuery.gte("last_login_at", dateRange.start);

  const { count: activeUsers } = await userQuery;

  // Lesson completions
  let progressQuery = supabaseAdmin
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("completed", true);

  if (dateRange?.start) progressQuery = progressQuery.gte("completed_at", dateRange.start);

  const { count: completions } = await progressQuery;

  // Tool usage
  let toolQuery = supabaseAdmin
    .from("tool_usage_logs")
    .select("tool_name")
    .eq("status", "success");

  if (dateRange?.start) toolQuery = toolQuery.gte("created_at", dateRange.start);

  const { data: toolUsage } = await toolQuery;

  const toolCounts = (toolUsage || []).reduce((acc: any, t: any) => {
    acc[t.tool_name] = (acc[t.tool_name] || 0) + 1;
    return acc;
  }, {});

  return {
    activeUsers: activeUsers || 0,
    completions: completions || 0,
    toolUsage: Object.entries(toolCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10),
  };
}

// ============= BONUS TOOLS (Role-dependent) =============

async function searchContent(ctx: AuthContext, params: any): Promise<any> {
  const { query, moduleId, lessonId, language = "he" } = params;

  if (ctx.role === "admin") {
    // Admin: search all content
    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id, title, description, chapters!inner (title, modules!inner (id, title))")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    return { results: lessons || [], scope: "all" };
  } else {
    // Student: search only accessible content
    const { data: access } = await supabaseAdmin
      .from("user_module_access")
      .select("module_id")
      .eq("user_email", ctx.userEmail.toLowerCase());

    const accessibleModules = (access || []).map((a) => a.module_id);

    // Also include free modules
    const { data: freeModules } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("is_paid", false)
      .eq("is_hidden", false);

    const allAccessibleModules = [...new Set([...accessibleModules, ...(freeModules || []).map((m) => m.id)])];

    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id, title, description, chapters!inner (title, module_id, modules!inner (title))")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .in("chapters.module_id", allAccessibleModules)
      .limit(20);

    return { results: lessons || [], scope: "accessible" };
  }
}

async function listModules(ctx: AuthContext, params: any): Promise<any> {
  const { language = "he", includeHidden = false } = params;

  if (ctx.role === "admin") {
    const { data } = await supabaseAdmin
      .from("modules")
      .select("id, title, description, is_paid, is_hidden, status")
      .order("order_index");
    return { modules: data || [], scope: "all" };
  } else {
    // Student: visible modules + modules they have access to
    const { data: access } = await supabaseAdmin
      .from("user_module_access")
      .select("module_id")
      .eq("user_email", ctx.userEmail.toLowerCase());

    const accessibleModules = (access || []).map((a) => a.module_id);

    const { data: modules } = await supabaseAdmin
      .from("modules")
      .select("id, title, description, is_paid")
      .eq("status", "active")
      .or(`is_hidden.eq.false,id.in.(${accessibleModules.join(",")})`)
      .order("order_index");

    return { modules: modules || [], scope: "accessible" };
  }
}

async function viewUserAccess(ctx: AuthContext, params: any): Promise<any> {
  const { userEmail, moduleId } = params;

  if (ctx.role === "admin") {
    // Admin can view any user's access
    let query = supabaseAdmin
      .from("user_module_access")
      .select("*, modules (title)");

    if (userEmail) query = query.eq("user_email", userEmail.toLowerCase());
    if (moduleId) query = query.eq("module_id", moduleId);

    const { data } = await query.limit(100);
    return { access: data || [] };
  } else {
    // Student can only view their own
    const { data } = await supabaseAdmin
      .from("user_module_access")
      .select("*, modules (title)")
      .eq("user_email", ctx.userEmail.toLowerCase());

    return { access: data || [] };
  }
}

// ============= TOOL REGISTRY =============

const toolHandlers: Record<string, (ctx: AuthContext, params: any) => Promise<any>> = {
  // Student tools
  summarize_lesson: summarizeLesson,
  explain_concept: explainConcept,
  extract_key_takeaways: extractKeyTakeaways,
  generate_examples: generateExamples,
  create_flashcards: createFlashcards,
  generate_quiz: generateQuiz,
  check_understanding: checkUnderstanding,
  lesson_action_plan: lessonActionPlan,
  summarize_attachment: summarizeAttachment,
  extract_links_and_notes: extractLinksAndNotes,
  my_progress_overview: myProgressOverview,
  recommend_next_lesson: recommendNextLesson,
  set_learning_goal: setLearningGoal,
  draft_comment: draftComment,
  rephrase_comment: rephraseComment,
  report_issue: reportIssue,
  // Admin tools
  admin_create_module: adminCreateModule,
  admin_update_module: adminUpdateModule,
  admin_create_chapter: adminCreateChapter,
  admin_create_lesson: adminCreateLesson,
  admin_bulk_publish: adminBulkPublish,
  admin_content_audit: adminContentAudit,
  admin_list_comments: adminListComments,
  admin_moderate_comment: adminModerateComment,
  admin_comment_insights: adminCommentInsights,
  admin_find_user: adminFindUser,
  admin_grant_access: adminGrantAccess,
  admin_revoke_access: adminRevokeAccess,
  admin_set_cohort: adminSetCohort,
  admin_user_profile_view: adminUserProfileView,
  admin_reset_progress: adminResetProgress,
  admin_list_purchases: adminListPurchases,
  admin_reconcile_purchase: adminReconcilePurchase,
  admin_trigger_webhook_test: adminTriggerWebhookTest,
  admin_fix_missing_access: adminFixMissingAccess,
  admin_crm_list_tickets: adminCrmListTickets,
  admin_crm_update_ticket: adminCrmUpdateTicket,
  admin_system_health: adminSystemHealth,
  admin_error_logs: adminErrorLogs,
  admin_usage_stats: adminUsageStats,
  // Bonus tools
  search_content: searchContent,
  list_modules: listModules,
  view_user_access: viewUserAccess,
};

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let ctx: AuthContext | null = null;
  let toolName = "";
  let params: any = {};

  try {
    const authHeader = req.headers.get("authorization");
    ctx = await verifyAuth(authHeader);

    const body = await req.json();
    toolName = body.tool;
    params = body.params || {};

    if (!toolName || !toolHandlers[toolName]) {
      throw new Error(`כלי לא נמצא: ${toolName}`);
    }

    // Check if tool is enabled
    const { data: toolSettings } = await supabaseAdmin
      .from("mcp_tool_settings")
      .select("is_enabled, allowed_roles")
      .eq("tool_name", toolName)
      .single();

    if (toolSettings && !toolSettings.is_enabled) {
      throw new Error("כלי זה אינו פעיל כרגע");
    }

    if (toolSettings && !toolSettings.allowed_roles.includes(ctx.role)) {
      throw new Error("אין לך הרשאה להשתמש בכלי זה");
    }

    // Execute tool
    const result = await toolHandlers[toolName](ctx, params);

    // Log success
    await logToolUsage(
      toolName,
      ctx,
      params.moduleId || null,
      params.lessonId || null,
      "success",
      undefined,
      Date.now() - startTime
    );

    return new Response(
      JSON.stringify({
        success: true,
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        data: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("MCP Tool Error:", error.message);

    // Log error
    if (ctx) {
      await logToolUsage(
        toolName || "unknown",
        ctx,
        params.moduleId || null,
        params.lessonId || null,
        "error",
        error.message,
        Date.now() - startTime
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "שגיאה לא צפויה",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
