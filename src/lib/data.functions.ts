import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) throw error;
    return data;
  });

export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_settings")
      .update(data)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const getMaterials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data;
  });

export const addMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: material, error } = await supabase
      .from("materials")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return material;
  });

export const deleteMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const getQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const saveQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return quote;
  });

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const updateQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string, status: string, sold_price?: number, sold_profit?: number, sold_at?: string, lost_reason?: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("quotes")
      .update({ 
        ...updateData, 
        status_changed_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) throw error;
    return { success: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);
    
    if (error) throw error;
    return { success: true };
  });
