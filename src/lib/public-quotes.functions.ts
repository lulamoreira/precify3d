import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getPublicQuote = createServerFn({ method: "GET" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc('get_public_quote', { _token: token });
    if (error) throw error;
    return data;
  });

export const generatePublicLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { quoteId: string, days: number }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { quoteId, days } = data;
    
    // Generate a secure random token
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    
    const { error } = await supabase
      .from("quotes")
      .update({
        public_token: token,
        public_expires_at: expiresAt.toISOString(),
        viewed_at: null
      })
      .eq("id", quoteId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { token, expiresAt };
  });

export const revokePublicLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((quoteId: string) => quoteId)
  .handler(async ({ data: quoteId, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("quotes")
      .update({
        public_token: null,
        public_expires_at: null
      })
      .eq("id", quoteId)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const deleteQuoteWithFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    
    // 1. Get items to find file paths
    const { data: items } = await supabase
      .from("quote_items")
      .select("stl_path")
      .eq("quote_id", id)
      .not("stl_path", "is", null);
    
    // 2. Delete files from storage
    if (items && items.length > 0) {
      const paths = items.map(i => i.stl_path as string);
      await supabase.storage.from("quote-files").remove(paths);
    }
    
    // 3. Delete quote (cascade will handle items)
    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });
