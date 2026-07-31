export const countries = ["Philippines","Indonesia","Myanmar","India","Nepal","Sri Lanka"] as const;
export type Country = typeof countries[number];
export type Role = "super_admin"|"admin"|"recruiter"|"viewer";
export type CandidateStatus = "new"|"for_review"|"qualified"|"approved_for_contact"|"contacted"|"replied"|"registration_sent"|"registered"|"interview_scheduled"|"interviewed"|"accepted"|"rejected"|"duplicate"|"not_qualified"|"archived";
export interface Profile { id:string; full_name:string; email:string; role:Role; avatar_url:string|null; is_active:boolean; last_login_at:string|null; }
export interface Candidate {
  id:string; full_name:string|null; country:Country; city:string|null; job_type:string|null; languages:string[]; skills:string[];
  experience_summary:string|null; years_experience:number|null; phone:string|null; email:string|null; source_url:string;
  source_domain:string|null; source_title:string|null; source_text:string|null; qualification_score:number; confidence_score:number;
  ai_reason:string|null; singapore_interest:boolean; actively_seeking_work:boolean; passport_mentioned:boolean;
  available_immediately:boolean; status:CandidateStatus; assigned_recruiter_id:string|null; discovered_at:string;
}
export interface Qualification {
  qualified:boolean; actively_seeking_work:boolean; candidate_type:"individual"|"agency"|"employer"|"job_advertisement"|"unknown";
  country:Country|null; job_type:string|null; skills:string[]; languages:string[]; experience_summary:string|null;
  years_experience:number|null; singapore_interest:boolean; passport_mentioned:boolean; available_immediately:boolean;
  full_name:string|null; phone:string|null; email:string|null; public_profile_url:string|null; confidence:number;
  reason:string; rejection_reason:string|null; qualification_score:number;
}
export interface CandidateNote { id:string; candidate_id:string; user_id:string; note:string; is_private:boolean; created_at:string; }
export interface CandidateActivity { id:string; candidate_id:string; user_id:string|null; activity_type:string; description:string; created_at:string; }
