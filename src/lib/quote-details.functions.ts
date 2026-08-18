import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getQuoteDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    
    // Get quote and client info
    const { data: quote, error: qError } = await supabase
      .from("quotes")
      .select("*, clients(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    
    if (qError) throw qError;

    // Get items
    const { data: items, error: iError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .eq("user_id", userId)
      .order("position", { ascending: true });
    
    if (iError) throw iError;

    // Get user branding info
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("company_name, company_logo_path, brand_color, email, phone, full_name, address_number, address_complement, city, cep")
      .eq("id", userId)
      .single();
    
    if (pError) throw pError;

    return { 
      quote, 
      items, 
      branding: profile 
    };
  });
