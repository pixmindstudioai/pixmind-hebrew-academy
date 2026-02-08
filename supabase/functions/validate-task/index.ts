import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch submission with task details
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select(`
        *,
        lesson_tasks (
          instructions,
          allowed_types
        )
      `)
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Failed to fetch submission:", fetchError);
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare content for AI review
    let contentForReview = "";
    
    if (submission.content_text) {
      contentForReview = submission.content_text;
    } else if (submission.content_url) {
      // For files/images, we describe what was uploaded
      contentForReview = `[${submission.submission_type === 'image' ? 'תמונה' : 'קובץ'} הועלה: ${submission.content_url}]`;
    }

    const taskInstructions = submission.lesson_tasks?.instructions || "";

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

const systemPrompt = `אתה מערכת בדיקה אוטומטית למשימות לימודיות. 
תפקידך לבדוק האם הגשת התלמיד עומדת בדרישות המשימה.

כללי הבדיקה:
1. בדוק האם התוכן רלוונטי להוראות המשימה
2. בדוק האם יש מאמץ אמיתי בהגשה (לא תשובה ריקה או חסרת משמעות)
3. זהה ניסיונות לעקוף את המערכת (כמו "המשימה בוצעה", "ראה קובץ מצורף" בלי תוכן אמיתי)
4. אם הוגשה תמונה או קובץ, הנח שהתוכן תקין אלא אם יש סיבה לחשוד אחרת
5. זהה ניסיונות רמאות כמו תשובות מועתקות, מלל חסר משמעות, או הגשות שלא קשורות לנושא

עליך להחזיר JSON בפורמט הבא בלבד:
{
  "approved": true או false,
  "confidence": מספר בין 0 ל-100,
  "explanation": "הסבר קצר בעברית (עד 100 מילים)",
  "cheating_suspected": true או false
}`;

    const userPrompt = `הוראות המשימה:
${taskInstructions}

הגשת התלמיד:
${contentForReview}

בדוק את ההגשה והחזר JSON בלבד.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      // Handle rate limiting
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required for AI service" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI validation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let validationResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent, parseError);
      // Default to pending if parsing fails
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize confidence to 0-100 scale (AI might return 0-1 or 0-100)
    let confidence = validationResult.confidence || 50;
    if (confidence <= 1) {
      confidence = confidence * 100;
    }

    // Update submission with AI result
    const { error: updateError } = await supabase
      .from("task_submissions")
      .update({
        ai_status: validationResult.approved ? "approved" : "rejected",
        ai_confidence: confidence,
        ai_explanation: validationResult.explanation || "",
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Failed to update submission:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        approved: validationResult.approved,
        confidence: validationResult.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-task:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
