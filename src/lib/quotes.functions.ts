import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error, count } = await supabase
      .from("clients")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return { data, count };
  });

export const saveClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...updateData } = data;
    
    if (id) {
      const { data: client, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return client;
    } else {
      const { data: client, error } = await supabase
        .from("clients")
        .insert({ ...updateData, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return client;
    }
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const getQuoteDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    
    const { data: quote, error: qError } = await supabase
      .from("quotes")
      .select("*, clients(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    
    if (qError) throw qError;

    const { data: items, error: iError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .eq("user_id", userId)
      .order("position", { ascending: true });
    
    if (iError) throw iError;

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

export const saveFullQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { items, ...quoteData } = data;
    
    let quoteId = quoteData.id;

    if (!quoteId) {
      const { data: nextNumber, error: nError } = await supabase.rpc('next_quote_number');
      if (nError) throw nError;
      quoteData.quote_number = nextNumber;
    }

    const { data: quote, error: qError } = await supabase
      .from("quotes")
      .upsert({ ...quoteData, user_id: userId })
      .select()
      .single();
    
    if (qError) throw qError;
    quoteId = quote.id;

    const { error: dError } = await supabase
      .from("quote_items")
      .delete()
      .eq("quote_id", quoteId);
    if (dError) throw dError;

    if (items && items.length > 0) {
      const { error: iError } = await supabase
        .from("quote_items")
        .insert(items.map((item: any, index: number) => {
          const { id, created_at, ...rest } = item;
          return {
            ...rest,
            quote_id: quoteId,
            user_id: userId,
            position: index
          };
        }));
      if (iError) throw iError;
    }

    return quote;
  });

export const getSignedUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bucket: string, path: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 3600);
    
    if (error) throw error;
    return signed.signedUrl;
  });
