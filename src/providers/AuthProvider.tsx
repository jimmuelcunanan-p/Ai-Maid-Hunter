import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { authService } from "../services/authService";

interface AuthContextValue {
  session:Session|null;
  loading:boolean;
  signIn:(email:string,password:string)=>Promise<void>;
  signOut:()=>Promise<void>;
}

const AuthContext=createContext<AuthContextValue|null>(null);

export function AuthProvider({children}:{children:React.ReactNode}){
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(isSupabaseConfigured);

  useEffect(()=>{
    let active=true;
    void authService.session().then(value=>{if(active)setSession(value)}).finally(()=>{if(active)setLoading(false)});
    const {data}=supabase.auth.onAuthStateChange((_event,nextSession)=>{if(active)setSession(nextSession)});
    return ()=>{active=false;data.subscription.unsubscribe()};
  },[]);

  const value=useMemo<AuthContextValue>(()=>({
    session,
    loading,
    async signIn(email,password){const next=await authService.signIn(email,password);setSession(next)},
    async signOut(){await authService.signOut();setSession(null)},
  }),[session,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth():AuthContextValue {
  const context=useContext(AuthContext);
  if(!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
