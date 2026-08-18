import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getQuotaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc('quota_status');
    if (error) throw error;
    return data[0];
  });

export const consumePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({
    fingerprint: z.string(),
    label: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc('consume_pricing', {
      _fingerprint: data.fingerprint,
      _label: data.label
    });
    if (error) throw error;
    return result[0];
  });

export const getPlans = createServerFn({ method: "GET" })
  .handler(async () => {
    // Public read for pricing page
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data;
  });
