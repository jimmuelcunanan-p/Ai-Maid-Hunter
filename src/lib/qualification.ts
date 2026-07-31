import { z } from "zod";
import { countries, type Qualification } from "../types";

export const qualificationSchema = z.object({
  qualified:z.boolean(), actively_seeking_work:z.boolean(),
  candidate_type:z.enum(["individual","agency","employer","job_advertisement","unknown"]),
  country:z.enum(countries).nullable(), job_type:z.string().nullable(), skills:z.array(z.string()), languages:z.array(z.string()),
  experience_summary:z.string().nullable(), years_experience:z.number().nonnegative().nullable(),
  singapore_interest:z.boolean(), passport_mentioned:z.boolean(), available_immediately:z.boolean(),
  full_name:z.string().nullable(), phone:z.string().nullable(), email:z.string().nullable(),
  public_profile_url:z.string().url().nullable(), confidence:z.number().int().min(0).max(100),
  reason:z.string(), rejection_reason:z.string().nullable()
});
export type RawQualification = z.infer<typeof qualificationSchema>;
export function leadScore(q:RawQualification):number {
  return Math.min(100,(q.country?20:0)+(q.actively_seeking_work?25:0)+(q.job_type?20:0)+(q.years_experience!==null?10:0)+(q.singapore_interest?10:0)+(q.phone||q.email?5:0)+(q.passport_mentioned?5:0)+(q.available_immediately?5:0));
}
export function finalizeQualification(raw:unknown):Qualification {
  const q=qualificationSchema.parse(raw); const qualification_score=leadScore(q);
  return {...q,qualification_score,qualified:q.qualified&&q.candidate_type==="individual"&&q.actively_seeking_work&&q.country!==null&&q.confidence>=80&&qualification_score>=65};
}
export function normalizeUrl(value:string):string {
  const url=new URL(value); url.hostname=url.hostname.toLowerCase(); url.hash="";
  ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid","ref","source","campaign"].forEach(k=>url.searchParams.delete(k));
  const sorted=[...url.searchParams.entries()].sort(([a],[b])=>a.localeCompare(b)); url.search="";
  sorted.forEach(([k,v])=>{ if(!url.searchParams.has(k)) url.searchParams.append(k,v); });
  url.pathname=url.pathname.replace(/\/+$/,"")||"/"; return url.toString().replace(/\/$/,"");
}
