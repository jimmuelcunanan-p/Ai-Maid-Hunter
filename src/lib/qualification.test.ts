import {describe,expect,it} from "vitest"; import {leadScore,normalizeUrl} from "./qualification";
const base={qualified:true,actively_seeking_work:true,candidate_type:"individual" as const,country:"Philippines" as const,job_type:"Domestic Helper",skills:[],languages:[],experience_summary:null,years_experience:2,singapore_interest:true,passport_mentioned:false,available_immediately:false,full_name:null,phone:null,email:null,public_profile_url:null,confidence:90,reason:"",rejection_reason:null};
describe("lead scoring",()=>it("scores only explicit evidence",()=>expect(leadScore(base)).toBe(85)));
describe("URL normalization",()=>it("removes tracking and sorts parameters",()=>expect(normalizeUrl("HTTPS://Example.COM/post/?utm_source=x&b=2&a=1#x")).toBe("https://example.com/post?a=1&b=2")));
