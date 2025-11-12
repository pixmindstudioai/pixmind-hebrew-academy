import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeshulamWebhookPayload {
  payerEmail?: string;
  fullName?: string;
  paymentDesc?: string;
  transactionCode?: string;
  paymentSum?: number | string;
  paymentDate?: string;
  // Alternative field names that might be used
  email?: string;
  name?: string;
  description?: string;
  transaction_id?: string;
  amount?: number | string;
  date?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('=== Meshulam Webhook Received ===');
    
    // Parse the incoming payload
    const payload: MeshulamWebhookPayload = await req.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Log the webhook event
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        provider: 'meshulam',
        event_type: 'payment_completed',
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Extract data with fallback field names
    const userEmail = (payload.payerEmail || payload.email || '').toLowerCase().trim();
    const fullName = payload.fullName || payload.name || '';
    const paymentDesc = payload.paymentDesc || payload.description || '';
    const transactionCode = payload.transactionCode || payload.transaction_id || '';
    const paymentSum = parseFloat(String(payload.paymentSum || payload.amount || 0));
    const paymentDate = payload.paymentDate || payload.date || new Date().toISOString();

    // Validate required fields
    if (!userEmail || !transactionCode) {
      console.error('Missing required fields:', { userEmail, transactionCode });
      await supabase
        .from('webhook_logs')
        .update({
          processed: true,
          error_message: 'Missing required fields: userEmail or transactionCode',
        })
        .eq('id', logData?.id);

      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing payment for:', userEmail);

    // Check if this transaction was already processed (prevent duplicates)
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('transaction_id', transactionCode)
      .single();

    if (existingPurchase) {
      console.log('Transaction already processed:', transactionCode);
      await supabase
        .from('webhook_logs')
        .update({
          processed: true,
          error_message: 'Duplicate transaction - already processed',
        })
        .eq('id', logData?.id);

      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Transaction already processed',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to match the payment description to a module via payment_product_map
    const { data: productMap } = await supabase
      .from('payment_product_map')
      .select('module_id, product_id')
      .eq('provider', 'meshulam')
      .or(`product_id.ilike.%${paymentDesc}%`);

    let moduleId: string | null = null;

    if (productMap && productMap.length > 0) {
      moduleId = productMap[0].module_id;
      console.log('Matched module:', moduleId);
    } else {
      console.log('No module match found for:', paymentDesc);
      // Log but don't fail - just record the purchase without module mapping
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_email: userEmail,
        module_id: moduleId,
        amount: paymentSum,
        currency: 'ILS',
        transaction_id: transactionCode,
        provider: 'meshulam',
        payment_date: paymentDate,
        status: 'completed',
        payment_desc: paymentDesc,
        full_name: fullName,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase:', purchaseError);
      await supabase
        .from('webhook_logs')
        .update({
          processed: true,
          error_message: `Purchase creation failed: ${purchaseError.message}`,
        })
        .eq('id', logData?.id);

      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Failed to create purchase record',
          error: purchaseError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Purchase created:', purchase.id);

    // Grant user access to the module if module was matched
    if (moduleId) {
      const { error: accessError } = await supabase
        .from('user_module_access')
        .upsert(
          {
            user_email: userEmail,
            module_id: moduleId,
            expires_at: null, // Lifetime access
            notes: `Meshulam payment via webhook - Transaction: ${transactionCode}`,
            provider: 'meshulam',
            transaction_id: transactionCode,
            granted_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_email,module_id',
          }
        );

      if (accessError) {
        console.error('Failed to grant access:', accessError);
        await supabase
          .from('webhook_logs')
          .update({
            processed: true,
            error_message: `Access grant failed: ${accessError.message}`,
          })
          .eq('id', logData?.id);

        return new Response(
          JSON.stringify({
            status: 'partial_success',
            message: 'Purchase recorded but failed to grant access',
            error: accessError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Access granted to module:', moduleId);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('id', logData?.id);

    console.log('=== Webhook Processing Complete ===');

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Purchase processed successfully',
        purchase_id: purchase.id,
        module_access_granted: !!moduleId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
