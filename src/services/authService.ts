import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export const authService = {
  async signIn(email:string,password:string):Promise<Session|null> {
    if(!isSupabaseConfigured) return null;
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error) throw error;
    return data.session;
  },
  async signOut():Promise<void> {
    if(!isSupabaseConfigured) return;
    const {error}=await supabase.auth.signOut();
    if(error) throw error;
  },
  async session():Promise<Session|null> {
    if(!isSupabaseConfigured) return null;
    const {data,error}=await supabase.auth.getSession();
    if(error) throw error;
    return data.session;
  },
};
