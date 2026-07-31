import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { finalizeQualification } from "../lib/qualification";
import type { Candidate, Country, Qualification } from "../types";

export const candidateService={
  async list():Promise<Candidate[]> {
    if(!isSupabaseConfigured) return [];
    const {data,error}=await supabase.from("candidates").select("*").order("discovered_at",{ascending:false}); if(error) throw error; return data as Candidate[];
  },
  async create(input:{title:string;text:string;url:string;country:Country;qualification:Qualification}):Promise<Candidate> {
    const q=input.qualification; const row={full_name:q.full_name,country:q.country??input.country,job_type:q.job_type,languages:q.languages,skills:q.skills,experience_summary:q.experience_summary,years_experience:q.years_experience,phone:q.phone,email:q.email,source_url:input.url,source_domain:new URL(input.url).hostname,source_title:input.title,source_text:input.text,qualification_score:q.qualification_score,confidence_score:q.confidence,ai_reason:q.reason,singapore_interest:q.singapore_interest,actively_seeking_work:q.actively_seeking_work,passport_mentioned:q.passport_mentioned,available_immediately:q.available_immediately,status:q.qualified?"qualified":"for_review"};
    if(!isSupabaseConfigured) return {id:crypto.randomUUID(),city:null,assigned_recruiter_id:null,discovered_at:new Date().toISOString(),...row} as Candidate;
    const {data,error}=await supabase.from("candidates").insert(row).select().single(); if(error) throw error; return data as Candidate;
  },
  async qualify(input:{title:string;text:string;url:string;country:Country}):Promise<Qualification> {
    if(isSupabaseConfigured){
      const {data,error}=await supabase.functions.invoke("qualify-candidate",{body:{title:input.title,snippet:"",page_text:input.text,source_url:input.url,expected_country:input.country}});
      if(error){
        const context=(error as {context?:unknown}).context;
        if(context instanceof Response){
          let detail="";
          try{const payload=await context.clone().json() as {error?:string};detail=payload.error??""}catch{detail=await context.clone().text()}
          throw new Error(detail||`Qualification service returned HTTP ${context.status}.`);
        }
        throw error;
      }
      return finalizeQualification(data);
    }
    const lower=input.text.toLowerCase(); const seeking=/looking|seeking|mencari|naghahanap|work|job/.test(lower); const relevant=/maid|helper|nanny|caregiver|housekeep|kasambahay|pembantu/.test(lower);
    return finalizeQualification({qualified:seeking&&relevant,actively_seeking_work:seeking,candidate_type:seeking&&relevant?"individual":"unknown",country:input.country,job_type:relevant?"Domestic Helper":null,skills:[...(lower.includes("child")?["Childcare"]:[]),...(lower.includes("cook")?["Cooking"]:[])],languages:[],experience_summary:null,years_experience:null,singapore_interest:lower.includes("singapore"),passport_mentioned:lower.includes("passport"),available_immediately:lower.includes("immediately"),full_name:null,phone:null,email:null,public_profile_url:null,confidence:seeking&&relevant?88:45,reason:seeking&&relevant?"The post explicitly indicates an individual seeking relevant domestic work.":"Employment-seeking intent or relevant role is unclear.",rejection_reason:seeking&&relevant?null:"Insufficient evidence"});
  }
};
