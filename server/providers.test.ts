import {describe,expect,it} from "vitest";
import {enforceApplicantIntent,matchesSelectedCountry,MockAnalyzerProvider,TavilySearchProvider,generateSearchQueries} from "./providers";
const analyzer=new MockAnalyzerProvider();
const post=(text:string)=>({name:"Test Person",title:"Public post",text,url:"https://example.com/test",source:"Mock",publishedAt:new Date()});
describe("MockAnalyzerProvider",()=>{
 it("distinguishes an applicant from an employer",async()=>{
  expect((await analyzer.analyze(post("I am looking for a domestic helper job in Singapore."))).classification).toBe("ASPIRING_HELPER");
  expect((await analyzer.analyze(post("Our family is looking for a domestic helper."))).classification).toBe("EMPLOYER");
 });
 it("flags suspicious promises",async()=>expect((await analyzer.analyze(post("I am looking for a helper job. Pay today for guaranteed deployment."))).riskFlags).toContain("Suspicious payment or guarantee language"));
});
describe("enforceApplicantIntent",()=>{
 it("keeps a maid explicitly seeking employment and rejects a hiring family",()=>{
  const base={classification:"EMPLOYER" as const,explicitJobIntent:false,country:"Philippines",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:90,summary:"",riskFlags:[]};
  expect(enforceApplicantIntent(post("I am a maid seeking employment in Singapore for household duties."),base).classification).toBe("ASPIRING_HELPER");
  expect(enforceApplicantIntent(post("Our family is looking to hire a domestic helper."),base).classification).toBe("EMPLOYER");
 });
 it("rejects an agency advertising available maids",()=>{
  const base={classification:"ASPIRING_HELPER" as const,explicitJobIntent:true,country:"Philippines",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:90,summary:"",riskFlags:[]};
  expect(enforceApplicantIntent(post("Agency: trained maids available for employers."),base).classification).toBe("RECRUITMENT_AGENCY");
 });
 it("requires both personal job intent and a domestic-work role",()=>{
  const base={classification:"ASPIRING_HELPER" as const,explicitJobIntent:true,country:"Philippines",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:90,summary:"",riskFlags:[]};
  expect(enforceApplicantIntent(post("I am looking for an accounting job."),base).explicitJobIntent).toBe(false);
  expect(enforceApplicantIntent(post("Domestic helper services available."),base).explicitJobIntent).toBe(false);
 });
 it("rejects a family looking to hire a helper",()=>{
  const base={classification:"ASPIRING_HELPER" as const,explicitJobIntent:true,country:"India",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:90,summary:"",riskFlags:[]};
  const text="Looking for a helper (preferably fresher) for our Indian family of 3 in Singapore. We are looking for someone who can cook, clean and care for children. Salary and weekly off can be discussed.";
  const result=enforceApplicantIntent(post(text),base);
  expect(result.classification).toBe("EMPLOYER");
  expect(result.explicitJobIntent).toBe(false);
 });
 it("rejects a third-party domestic-helper availability profile",()=>{
  const base={classification:"UNCLEAR" as const,explicitJobIntent:false,country:"Philippines",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:80,summary:"",riskFlags:[]};
  const result=enforceApplicantIntent(post("My name is Ana. Domestic helper in Singapore. Current employment status: finished contract. Available from: August."),base);
  expect(result.classification).toBe("UNCLEAR");
  expect(result.explicitJobIntent).toBe(false);
 });
 it("accepts a first-person helper seeking an employer even when she mentions an agency",()=>{
  const base={classification:"RECRUITMENT_AGENCY" as const,explicitJobIntent:false,country:"Indonesia",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:80,summary:"",riskFlags:[]};
  const result=enforceApplicantIntent(post("I am an Indonesian helper under an agency. I am now in Singapore looking for employer for elderly and childcare."),base);
  expect(result.classification).toBe("ASPIRING_HELPER");
  expect(result.explicitJobIntent).toBe(true);
 });
 it.each([
  ["Filipino","Naghahanap ng trabaho bilang kasambahay sa Singapore."],
  ["Bahasa Indonesia","Saya mencari pekerjaan sebagai pekerja rumah tangga di Singapura."],
  ["Burmese","စင်္ကာပူတွင် အိမ်အကူ အလုပ်ရှာနေသည်။"],
  ["Hindi","मैं सिंगापुर में घरेलू सहायक की नौकरी खोज रही हूँ।"],
  ["Nepali","सिंगापुरमा घरेलु कामदारको काम खोज्दै छु।"],
  ["Sinhala","සිංගප්පූරුවේ ගෘහ සේවිකා රැකියාවක් සොයමි."]
 ])("accepts explicit domestic job seeking in %s",(_language,text)=>{
  const base={classification:"UNCLEAR" as const,explicitJobIntent:false,country:null,destination:null,experience:null,skills:[],detectedLanguage:"Unknown",confidenceScore:80,summary:"",riskFlags:[]};
  const result=enforceApplicantIntent(post(text),base);
  expect(result.classification).toBe("ASPIRING_HELPER");
  expect(result.explicitJobIntent).toBe(true);
 });
});
describe("matchesSelectedCountry",()=>{
 it("rejects a Filipino classification from an India search",()=>{
  const analysis={classification:"ASPIRING_HELPER" as const,explicitJobIntent:true,country:"Philippines",destination:"Singapore",experience:null,skills:[],detectedLanguage:"English",confidenceScore:90,summary:"",riskFlags:[]};
  const input={country:"India",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 7 days"};
  expect(matchesSelectedCountry(input,analysis)).toBe(false);
  expect(matchesSelectedCountry({...input,country:"Philippines"},analysis)).toBe(true);
 });
 it("accepts any supported nationality for an all-countries search",()=>{
  const analysis={classification:"ASPIRING_HELPER" as const,explicitJobIntent:true,country:"Nepal",destination:"Singapore",experience:null,skills:[],detectedLanguage:"Nepali",confidenceScore:90,summary:"",riskFlags:[]};
  const input={country:"All selected countries",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 7 days"};
  expect(matchesSelectedCountry(input,analysis)).toBe(true);
  expect(matchesSelectedCountry(input,{...analysis,country:"Canada"})).toBe(false);
 });
});
describe("TavilySearchProvider",()=>{
 it("generates a public web and indexed Facebook query",()=>{
  const queries=generateSearchQueries({country:"Philippines",platform:"All public sources",destination:"Singapore",position:"Domestic Helper",language:"Filipino",dateRange:"Past 7 days"});
  expect(queries).toHaveLength(9);
  expect(queries[0]).toContain("Philippines");
  expect(queries[0]).toContain("applicant looking for job");
  expect(queries[1]).toContain("maid looking for domestic helper job");
  expect(queries[2]).toContain("transfer maid helper looking for new employer");
  expect(queries[3]).toContain("naghahanap ng trabaho");
  expect(queries[3]).toContain("Facebook:");
 });
 it("includes an Indian region and its common variants",()=>{
  const queries=generateSearchQueries({country:"India",region:"Northeast India",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 30 days"});
  expect(queries[0]).toContain("India");
  expect(queries[0]).toContain("from Northeast India");
 });
 it("targets a selected public platform",()=>{
  const queries=generateSearchQueries({country:"India",platform:"Reddit",destination:"Singapore",position:"Caregiver",language:"English",dateRange:"Any time"});
  expect(queries).toHaveLength(1);
  expect(queries[0]).toContain("Reddit:");
 });
 it("targets additional social platforms separately",()=>{
  const base={country:"Philippines",destination:"Singapore",position:"Domestic Helper",language:"Filipino",dateRange:"Any time"};
  expect(generateSearchQueries({...base,platform:"Instagram"})[0]).toContain("Instagram:");
  expect(generateSearchQueries({...base,platform:"TikTok"})[0]).toContain("TikTok:");
 });
 it("adds multiple domestic job-seeker queries for general web search",()=>{
  const queries=generateSearchQueries({country:"Philippines",platform:"General Web",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Any time"});
  expect(queries).toHaveLength(3);
  expect(queries.join(" ")).toContain("Maid Job Posts");
  expect(queries.join(" ")).toContain("Direct Applicant Posts");
 });
 it("generates an all-supported-countries search",()=>{
  const queries=generateSearchQueries({country:"All selected countries",platform:"General Web",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Any time"});
  expect(queries).toHaveLength(6);
  expect(queries.join(" ")).toContain("Philippines Applicants");
  expect(queries.join(" ")).toContain("Sri Lanka Applicants");
 });
 it("generates a multilingual search without selecting one language",()=>{
  const queries=generateSearchQueries({country:"All selected countries",platform:"Facebook",destination:"Singapore",position:"Domestic Helper",language:"All supported languages",dateRange:"Any time"});
  expect(queries.join(" ")).toContain("naghahanap ng trabaho");
  expect(queries.join(" ")).toContain("pekerja rumah tangga");
  expect(queries.join(" ")).toContain("အိမ်အကူ");
  expect(Math.max(...queries.map(query=>query.length))).toBeLessThanOrEqual(400);
 });
 it("keeps every Tavily query within 400 characters",()=>{
  const queries=generateSearchQueries({country:"India",region:"Indian Nepali",platform:"All public sources",destination:"Singapore",position:"Domestic Helper",language:"Nepali",dateRange:"Past 30 days"});
  expect(Math.max(...queries.map(query=>query.length))).toBeLessThanOrEqual(400);
 });
 it("maps and deduplicates Tavily results",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({results:[{title:"Test public post",url:"https://example.com/post/1",content:"I am looking for domestic helper work."},{title:"Duplicate",url:"https://example.com/post/1",content:"same"}]}),{status:200,headers:{"Content-Type":"application/json"}});
  try{
   const results=await new TavilySearchProvider("test-key").search({country:"Philippines",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 7 days"});
   expect(results).toHaveLength(1);expect(results[0].source).toBe("example.com");
  }finally{globalThis.fetch=original}
 });
 it("removes commercial maid-agency results before analysis",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({results:[
   {title:"Trusted Maid Agency Singapore",url:"https://goodhire.sg/helpers",content:"We provide trained maids and helpers."},
   {title:"Personal post",url:"https://facebook.com/public-post",content:"I am a domestic helper looking for work in Singapore."}
  ]}),{status:200,headers:{"Content-Type":"application/json"}});
  try{
   const results=await new TavilySearchProvider("test-key").search({country:"Philippines",platform:"General Web",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Any time"});
   expect(results.map(result=>result.url)).toEqual(["https://facebook.com/public-post"]);
  }finally{globalThis.fetch=original}
 });
});
