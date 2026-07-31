import { z } from "zod";
import crypto from "node:crypto";

export const analysisSchema = z.object({
  classification: z.enum(["ASPIRING_HELPER","EMPLOYER","RECRUITMENT_AGENCY","UNRELATED","UNCLEAR"]),
  explicitJobIntent: z.boolean(), country: z.string().nullable(), destination: z.string().nullable(),
  experience: z.string().nullable(), skills: z.preprocess(value=>value??[],z.array(z.string())), detectedLanguage: z.string(),
  confidenceScore: z.number().int().min(0).max(100), summary: z.string(), riskFlags: z.preprocess(value=>value??[],z.array(z.string()))
});
export type Analysis = z.infer<typeof analysisSchema>;
export type SearchInput = {country:string;region?:string;platform?:string;destination:string;position:string;language:string;dateRange:string};
export type PublicResult = {name:string;title:string;text:string;url:string;source:string;publishedAt:Date;countryHint?:string};
export interface SearchProvider { search(input:SearchInput):Promise<PublicResult[]> }
export interface AnalyzerProvider {
 analyze(result:PublicResult):Promise<Analysis>
 analyzeBatch?(results:PublicResult[]):Promise<Analysis[]>
}
export interface MessagingProvider { send(message:string):Promise<{externalId:string}> }
export interface ExistingWebsiteRegistrationProvider { createRegistration(leadId:string):Promise<{url:string}> }

export function enforceApplicantIntent(result:PublicResult,analysis:Analysis):Analysis {
 const text=`${result.title} ${result.text}`.toLowerCase();
 const agency=/\bagency\b|recruitment|we recruit|maids? available|helpers? available|workers? available|we provide|supply of maids?|placement service|maid supplier|penyalur|agen tenaga kerja|एजेंसी|මෑන්පවර්/.test(text);
 const employer=/our(?:\s+\w+){0,3}\s+family|family of \d+|we are looking for|looking for someone|looking to hire|looking for (?:a |an )?(?:domestic )?(?:helper|maid|caregiver)(?!\s+(?:job|work|position|employment))|helper needed|maid needed|hiring a helper|hire a maid|need a helper|salary (?:and|or)|weekly off|mencari pembantu|အိမ်အကူ လိုအပ်|सहायक चाहिए|සේවිකාවක් අවශ්‍ය/.test(text);
 const applicant=/\b(i am|i'm|im)\b.{0,80}\b(looking|seeking|need)\b.{0,80}\b(job|work|employment|employer)\b|(?:maid|helper|caregiver|housekeeper).{0,50}(?:looking for|seeking|needs?).{0,50}(?:job|work|employment|employer)|seeking (a )?(job|work|employment)|looking for (a )?(job|work)|need (a )?(job|work)|naghahanap ng trabaho|trabaho ang hanap|mencari pekerjaan|mencari kerja|butuh pekerjaan|အလုပ်ရှာ|အလုပ် ရှာ|नौकरी खोज|काम की तलाश|काम चाहिए|काम खोज्दै|जागिर खोज्दै|රැකියාවක් සොය|රැකියාවක් අවශ්‍ය/.test(text);
 const domesticRole=/domestic helper|domestic worker|household worker|housekeeper|housekeeping|house helper|\bmaid\b|caregiver|childcare|elderly care|kasambahay|katulong|pekerja rumah tangga|asisten rumah tangga|pembantu rumah tangga|အိမ်အကူ|အိမ်မှုကိစ္စ|घरेलू सहायक|घरेलू कामगार|नौकरानी|घरेलु कामदार|घरायसी काम|ගෘහ සේවක|ගෘහ සේවිකා|ගෘහ රැකවරණ/.test(text);
 const personalVoice=/\b(i am|i'm|im|my name is)\b.{0,160}\b(looking|seeking|need)\b.{0,80}\b(job|work|employment|employer)\b|naghahanap ng trabaho|saya mencari (?:pekerjaan|kerja)|အလုပ်ရှာ|नौकरी खोज|काम खोज्दै|රැකියාවක් සොය/.test(text);
 if(agency&&!personalVoice)return {...analysis,classification:"RECRUITMENT_AGENCY",explicitJobIntent:false};
 if(employer)return {...analysis,classification:"EMPLOYER",explicitJobIntent:false};
 if(applicant&&personalVoice&&domesticRole)return {...analysis,classification:"ASPIRING_HELPER",explicitJobIntent:true};
 return {...analysis,classification:analysis.classification==="ASPIRING_HELPER"?"UNCLEAR":analysis.classification,explicitJobIntent:false};
}

export function matchesSelectedCountry(input:SearchInput,analysis:Analysis):boolean {
 if(input.country==="All selected countries")return Boolean(analysis.country&&["Philippines","Indonesia","Myanmar","India","Nepal","Sri Lanka"].includes(analysis.country));
 return Boolean(analysis.country&&analysis.country.trim().toLowerCase()===input.country.trim().toLowerCase());
}

const samples: Omit<PublicResult,"publishedAt">[] = [
 ["Mira P.","Seeking domestic helper work","I am looking for a domestic helper job in Singapore. I have two years experience in childcare and cooking.","https://example.com/posts/01","Public Jobs Board"],
 ["Lina K.","Household worker opportunity wanted","Looking for household worker job overseas. Experienced with cleaning, cooking and elderly care.","https://example.com/posts/02","Community Careers"],
 ["Asha N.","Caregiver work","Caregiver looking for overseas work in Singapore. Available next month, elderly care experience.","https://example.com/posts/03","Public Jobs Board"],
 ["Dewi R.","Mencari pekerjaan","Saya mencari pekerjaan sebagai pekerja rumah tangga di Singapura. Pengalaman memasak dan menjaga anak.","https://example.com/posts/04","Community Careers"],
 ["May T.","အလုပ်ရှာနေသည်","စင်္ကာပူတွင် အိမ်အကူအလုပ် ရှာနေပါသည်။ ကလေးထိန်း အတွေ့အကြုံရှိပါသည်။","https://example.com/posts/05","Open Work Forum"],
 ["Nila S.","काम की तलाश","मैं सिंगापुर में घरेलू सहायक की नौकरी खोज रही हूँ। खाना पकाने का अनुभव है।","https://example.com/posts/06","Open Work Forum"],
 ["Anu G.","काम खोज्दै","सिंगापुरमा घरेलु कामदारको काम खोज्दै छु। सरसफाइ र वृद्ध हेरचाह अनुभव।","https://example.com/posts/07","Community Careers"],
 ["Savi J.","රැකියාවක් සොයමි","සිංගප්පූරුවේ ගෘහ සේවක රැකියාවක් සොයමි. ළමා රැකවරණ පළපුරුද්ද ඇත.","https://example.com/posts/08","Open Work Forum"],
 ["Family A.","Helper needed","Our family is looking for a domestic helper. Must enjoy childcare.","https://example.com/posts/09","Public Jobs Board"],
 ["Bright Path Agency","Workers wanted","We recruit helpers for many employers. Apply through our agency.","https://example.com/posts/10","Agency Directory"],
 ["Garden Club","Weekend plants","Looking for helpers to clean our community garden this Saturday.","https://example.com/posts/11","Community Board"],
 ["Unknown Poster","Work abroad?","Maybe I want to work overseas someday. Any advice?","https://example.com/posts/12","Open Work Forum"],
 ["Quick Visa Now","Guaranteed deployment","Pay today for guaranteed Singapore job and instant visa.","https://example.com/posts/13","Public Jobs Board"],
 ["Mira P.","Seeking domestic helper work copy","I am looking for a domestic helper job in Singapore. I have two years experience in childcare and cooking.","https://example.com/posts/14","Community Careers"],
 ["K. Applicant","First-time applicant","First-time helper looking for an agency and domestic work in Singapore. No country listed.","https://example.com/posts/15","Public Jobs Board"],
 ["Rosa Test","Ex-Singapore helper","Ex-Singapore helper looking for work. Skilled in childcare, cooking, and cleaning.","https://example.com/posts/16","Open Work Forum"]
].map(([name,title,text,url,source])=>({name,title,text,url,source}));

export class MockSearchProvider implements SearchProvider {
  async search(_:SearchInput){ return samples.map((x,i)=>({...x,publishedAt:new Date(Date.now()-i*86400000)})); }
}
const localTerms:Record<string,string[]>={
 "Filipino":["naghahanap ng trabaho bilang domestic helper","naghahanap ng trabaho bilang kasambahay"],
 "Bahasa Indonesia":["mencari pekerjaan sebagai pekerja rumah tangga","mencari kerja sebagai asisten rumah tangga"],
 "Burmese":["အိမ်အကူအလုပ် ရှာနေပါသည်","အိမ်အကူ အလုပ်ရှာနေသည်"],
 "Hindi":["घरेलू सहायक की नौकरी खोज रही हूँ","घरेलू कामगार का काम खोज रही हूँ"],
 "Nepali":["घरेलु कामदारको काम खोज्दै","घरायसी काम खोज्दै"],
 "Sinhala":["ගෘහ සේවක රැකියාවක් සොයමි","ගෘහ සේවිකා රැකියාවක් සොයමි"]
};
const indiaRegionTerms:Record<string,string[]>={
 "Darjeeling":["Darjeeling","Gorkhaland"],
 "Manipur":["Manipur","Manipuri"],
 "Sikkim":["Sikkim","Sikkimese"],
 "Mizoram":["Mizoram","Mizo"],
 "Arunachal Pradesh":["Arunachal Pradesh","Arunachal"],
 "Assam":["Assam","Assamese"],
 "Northeast India":["Northeast India","North East India","NE India"],
 "Indian Nepali":["Indian Nepali","Nepali-speaking India","Indian Gorkha"]
};
function regionExpression(input:SearchInput){
 if(input.country!=="India"||!input.region||input.region==="Any Indian region")return "";
 const terms=indiaRegionTerms[input.region]??[input.region];
 return `(${terms.map(term=>`"${term}"`).join(" OR ")})`;
}
export function generateSearchQueries(input:SearchInput){
 return searchTargets(input).map(target=>{
  const query=`${target.label}: ${target.query}`;
  if(query.length<=400)return query;
  throw Object.assign(new Error("The selected search filters produce a query longer than Tavily's 400-character limit"),{status:400});
 });
}
type SearchTarget={label:string;query:string;domains?:string[];country?:string};
function searchTargets(input:SearchInput):SearchTarget[]{
 const destination=input.destination==="Not specified"?"overseas":input.destination;
 const region=input.country==="India"&&input.region&&input.region!=="Any Indian region"?` from ${input.region}`:"";
 const localized=input.language==="All supported languages"
  ?"looking for work kasambahay pekerja rumah tangga အိမ်အကူ घरेलू सहायक घरेलु कामदार ගෘහ සේවිකා"
  :localTerms[input.language]?.[0];
 if(input.country==="All selected countries"){
  const supported=[["Philippines","Filipino"],["Indonesia","Bahasa Indonesia"],["Myanmar","Burmese"],["India","Hindi"],["Nepal","Nepali"],["Sri Lanka","Sinhala"]] as const;
  const platformDomains:Record<string,string[]|undefined>={
   Facebook:["facebook.com"],Instagram:["instagram.com"],TikTok:["tiktok.com"],LinkedIn:["linkedin.com"],Reddit:["reddit.com"],
   Indeed:["indeed.com"],
   "Job Boards":["jobstreet.com","jobsdb.com","foundit.in","naukri.com"]
  };
  const domains=platformDomains[input.platform||""];
  return supported.map(([country,language])=>({
   label:`${country} Applicants`,
   query:`Individual maid or domestic helper from ${country} personally looking for a job in ${destination}. ${localTerms[language][0]}. Public job-seeker post.`,
   domains,
   country
  }));
 }
 const origin=input.country==="All selected countries"?"Philippines Indonesia Myanmar India Nepal Sri Lanka":`${input.country}${region}`;
 const general=`${origin} ${input.position} applicant looking for job in ${destination}`;
 const social=`${origin} "${localized||"I am looking for work"}" ${input.position} ${destination}`;
 const maidPost=`${origin} maid looking for domestic helper job in ${destination}`;
 const directHire=`${origin} individual domestic helper seeking work or a new employer in ${destination}`;
 const transferPost=`${origin} transfer maid helper looking for new employer in ${destination}`;
 const targets:Record<string,SearchTarget[]>={
  "General Web":[{label:"General Web",query:general},{label:"Maid Job Posts",query:maidPost},{label:"Direct Applicant Posts",query:directHire}],
  "Facebook":[{label:"Facebook",query:social,domains:["facebook.com"]}],
  "Instagram":[{label:"Instagram",query:social,domains:["instagram.com"]}],
  "TikTok":[{label:"TikTok",query:social,domains:["tiktok.com"]}],
  "LinkedIn":[{label:"LinkedIn",query:`${origin} ${input.position} seeking employment ${destination}`,domains:["linkedin.com"]}],
  "Reddit":[{label:"Reddit",query:`${origin} looking for domestic work ${destination}`,domains:["reddit.com"]}],
  "Indeed":[{label:"Indeed",query:`${origin} ${input.position} job seeker ${destination}`,domains:["indeed.com"]}],
  "Job Boards":[{label:"Job Boards",query:`${origin} ${input.position} resume job seeker ${destination}`,domains:["jobstreet.com","jobsdb.com","foundit.in","naukri.com"]}],
 };
 return input.platform==="All public sources"||!input.platform
  ?[targets["General Web"][0],{label:"Maid Job Posts",query:maidPost},{label:"Transfer Helper Posts",query:transferPost},targets.Facebook[0],targets.Instagram[0],targets.TikTok[0],targets.LinkedIn[0],targets.Reddit[0],targets["Job Boards"][0]]
  :targets[input.platform]??targets["General Web"];
}
type TavilyResult={title?:string;url?:string;content?:string;published_date?:string;countryHint?:string};
const excludedAgencyDomains=["goodhire.sg","jlkmaids.com","bestmaid.com.sg","beyondmaidsg.com","maidssingapore.com"];
function isCommercialAgencyResult(result:TavilyResult){
 const text=`${result.title??""} ${result.content??""}`.toLowerCase();
 const hostname=result.url?new URL(result.url).hostname.replace(/^www\./,""):"";
 if(excludedAgencyDomains.some(domain=>hostname===domain||hostname.endsWith(`.${domain}`)))return true;
 return /\bmaid agency\b|employment agency|recruitment agency|we have (?:a |an )?(?:transfer |experienced )?(?:maid|helper)|maids? available for (?:hire|employers)|helpers? available for (?:hire|employers)|we (?:provide|supply|place|recruit) (?:maids?|helpers?|domestic workers?)|our available (?:maids?|helpers?)/.test(text);
}
function matchesSelectedRegion(result:TavilyResult,input:SearchInput){
 if(input.country!=="India"||!input.region||input.region==="Any Indian region")return true;
 const text=`${result.title??""} ${result.content??""}`.toLowerCase();
 return (indiaRegionTerms[input.region]??[input.region]).some(term=>text.includes(term.toLowerCase()));
}
export class TavilySearchProvider implements SearchProvider {
 constructor(private apiKey=process.env.TAVILY_API_KEY||"",private endpoint=process.env.TAVILY_BASE_URL||"https://api.tavily.com/search"){}
 async search(input:SearchInput):Promise<PublicResult[]>{
  if(!this.apiKey)throw Object.assign(new Error("Tavily search is selected but TAVILY_API_KEY is not configured"),{status:503});
  const time_range:Record<string,string|undefined>={"Past 24 hours":"day","Past 7 days":"week","Past 30 days":"month","Any time":undefined};
  const batches=await Promise.allSettled(searchTargets(input).map(async target=>{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),Number(process.env.TAVILY_TIMEOUT_MS||25_000));
   try{
    const response=await fetch(this.endpoint,{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json","Authorization":`Bearer ${this.apiKey}`},body:JSON.stringify({query:target.query,topic:"general",search_depth:"basic",max_results:6,include_answer:false,include_raw_content:false,time_range:time_range[input.dateRange],include_domains:target.domains,exclude_domains:excludedAgencyDomains,country:(target.country||input.country).toLowerCase()})});
    const payload:any=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(`Tavily API ${response.status}: ${payload?.detail?.error||payload?.detail||"search failed"}`),{status:502});
    return z.object({results:z.array(z.object({title:z.string().optional(),url:z.string().url(),content:z.string().optional(),published_date:z.string().optional()}))}).parse(payload).results.map(result=>({...result,countryHint:target.country}));
   }catch(error){
    if(error instanceof Error&&error.name==="AbortError")throw Object.assign(new Error("Tavily request timed out after 25 seconds"),{status:504});
    throw error;
   }finally{clearTimeout(timeout)}
  }));
  const successful:TavilyResult[][]=[];
  let firstFailure:unknown;
  for(const batch of batches){
   if(batch.status==="fulfilled")successful.push(batch.value);
   else if(firstFailure===undefined)firstFailure=batch.reason;
  }
  if(!successful.length){
   throw firstFailure??Object.assign(new Error("All Tavily searches failed"),{status:502});
  }
  const unique=new Map<string,TavilyResult>();
  for(const result of successful.flat())if(result.url&&!isCommercialAgencyResult(result)&&matchesSelectedRegion(result,input)&&!unique.has(result.url))unique.set(result.url,result);
  return [...unique.values()].slice(0,24).map((result,index)=>{
   const url=new URL(result.url!);
   return {
    name:(result.title||"Public search result").slice(0,100),
    title:(result.title||"Untitled public result").slice(0,200),
    text:(result.content||result.title||"").slice(0,4000),
    url:result.url!,
    source:url.hostname.replace(/^www\./,""),
    publishedAt:result.published_date&&!Number.isNaN(Date.parse(result.published_date))?new Date(result.published_date):new Date(Date.now()-index*60000),
    countryHint:result.countryHint
   };
  });
 }
}
export function createSearchProvider():{provider:SearchProvider;name:"tavily"|"mock";configured:boolean}{
 if((process.env.SEARCH_PROVIDER||"mock").toLowerCase()==="tavily")
  return {provider:new TavilySearchProvider(),name:"tavily",configured:Boolean(process.env.TAVILY_API_KEY)};
 return {provider:new MockSearchProvider(),name:"mock",configured:true};
}
const has=(s:string,r:RegExp)=>r.test(s.toLowerCase());
export class MockAnalyzerProvider implements AnalyzerProvider {
  async analyze(r:PublicResult):Promise<Analysis>{
    const t=`${r.title} ${r.text}`;
    const agency=has(t,/agency|we recruit|workers wanted/), employer=has(t,/our family|helper needed|we are looking for/);
    const seeker=has(t,/i am looking|looking for .* job|seeking|naghahanap ng trabaho|mencari pekerjaan|အလုပ် ရှာ|नौकरी खोज|काम खोज्दै|රැකියාවක් සොය|helper looking for work|first-time helper/);
    let classification:Analysis["classification"]=agency?"RECRUITMENT_AGENCY":employer?"EMPLOYER":seeker?"ASPIRING_HELPER":has(t,/garden|plants/)?"UNRELATED":"UNCLEAR";
    const country=has(t,/indonesia|indonesian|saya|pekerja/)?"Indonesia":has(t,/myanmar|burmese|အလုပ်/)?"Myanmar":has(t,/\bnepal\b|nepali|काम खोज्दै/)?"Nepal":has(t,/sri lanka|sri lankan|sinhala|රැකියාවක්/)?"Sri Lanka":has(t,/\bindia\b|indian|नौकरी खोज/)?"India":has(t,/philippines|philippine|filipino|filipina|tagalog|naghahanap ng trabaho/)?"Philippines":r.countryHint||null;
    const skills=["childcare","cooking","cleaning","elderly care"].filter(x=>has(t,new RegExp(x.replace(" ",".?"),"i")));
    const risks=[]; if(has(t,/guaranteed|pay today|instant visa/)) risks.push("Suspicious payment or guarantee language"); if(!country) risks.push("Country not stated");
    return analysisSchema.parse({classification,explicitJobIntent:classification==="ASPIRING_HELPER",country,destination:has(t,/singapore|singapura|စင်္ကာပူ|सिंगापुर|සිංගප්පූරුව/)?"Singapore":null,experience:has(t,/experience|experienced|အတွေ့အကြုံ|अनुभव|පළපුරුද්ද/)?"Experience stated in public post":null,skills,detectedLanguage:country==="Indonesia"?"Bahasa Indonesia":country==="Myanmar"?"Burmese":country==="India"?"Hindi":country==="Nepal"?"Nepali":country==="Sri Lanka"?"Sinhala":"English",confidenceScore:classification==="ASPIRING_HELPER"?88:classification==="UNCLEAR"?48:93,summary:classification==="ASPIRING_HELPER"?"The author explicitly states they are seeking relevant employment.":"The post does not clearly represent an individual seeking domestic-helper work.",riskFlags:risks});
  }
}
const analyzerSystemPrompt=`You classify fictional public employment posts for a recruitment-assistance prototype.
Return only a JSON object with exactly these fields:
classification: one of ASPIRING_HELPER, EMPLOYER, RECRUITMENT_AGENCY, UNRELATED, UNCLEAR
explicitJobIntent: boolean; true ONLY when the author personally and explicitly seeks the relevant job
country: string or null
destination: string or null
experience: string or null
skills: array of short strings
detectedLanguage: string
confidenceScore: integer 0-100
summary: concise factual string
riskFlags: array of short strings

ASPIRING_HELPER is allowed only when the author clearly says they personally seek domestic-helper,
household-worker, caregiver, childcare, or elderly-care employment. "Our family is looking for a
helper" is EMPLOYER. Agencies offering, supplying, advertising, or selling maids/helpers are
RECRUITMENT_AGENCY even when their post contains phrases such as "looking for work" or "available
for work." Apply the same rules to English, Filipino/Tagalog, Bahasa Indonesia, Burmese, Hindi,
Nepali, and Sinhala text. Do not infer intention or suitability from a name, gender, nationality,
religion, ethnicity, photograph, or appearance. Flag payment requests, guarantees, suspicious
urgency, or missing/unclear information.`;

export class GroqAnalyzerProvider implements AnalyzerProvider {
 constructor(
  private apiKey=process.env.GROQ_API_KEY||"",
  private model=process.env.GROQ_MODEL||"openai/gpt-oss-20b",
  private baseUrl=process.env.GROQ_BASE_URL||"https://api.groq.com/openai/v1"
 ){}
 async analyze(result:PublicResult):Promise<Analysis>{
  const values=await this.request([{publicDisplayName:result.name,title:result.title,postText:result.text,source:result.source}],false);
  return values[0];
 }
 async analyzeBatch(results:PublicResult[]):Promise<Analysis[]>{
  const posts=results.map(result=>({publicDisplayName:result.name,title:result.title,postText:result.text,source:result.source}));
  const batches:Array<Array<Record<string,string>>>=[];
  for(let offset=0;offset<posts.length;offset+=6)batches.push(posts.slice(offset,offset+6));
  return (await Promise.all(batches.map(batch=>this.requestResilient(batch)))).flat();
 }
 private async requestResilient(posts:Array<Record<string,string>>):Promise<Analysis[]>{
  return this.request(posts,posts.length>1);
 }
 private async request(posts:Array<Record<string,string>>,batch:boolean):Promise<Analysis[]>{
  if(!this.apiKey)throw new Error("GROQ_API_KEY is not configured");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),Number(process.env.GROQ_TIMEOUT_MS||15_000));
  try{
   let response:Response|undefined,payload:any;
   for(let attempt=0;attempt<4;attempt++){
    response=await fetch(`${this.baseUrl.replace(/\/$/,"")}/chat/completions`,{
    method:"POST",signal:controller.signal,
    headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({
     model:this.model,temperature:0.1,max_completion_tokens:batch?Math.min(1800,posts.length*250+300):700,
     response_format:{type:"json_object"},
     messages:[
      {role:"system",content:`${analyzerSystemPrompt}\n${batch?'For this batch, return {"analyses":[...]} in the exact input order. Each item must contain the fields above.':'Return the analysis object directly.'}`},
      {role:"user",content:JSON.stringify(batch?{posts}:posts[0])}
     ]
    })
    });
    payload=await response.json().catch(()=>({}));
    if(response.status!==429)break;
    const retryAfter=Number(response.headers.get("retry-after"));
    await new Promise(resolve=>setTimeout(resolve,Number.isFinite(retryAfter)?retryAfter*1000:1000*(attempt+1)));
   }
   if(!response)throw new Error("Groq request did not start");
   if(!response.ok)throw new Error(`Groq API ${response.status}: ${payload?.error?.message||"request failed"}`);
   const content=payload?.choices?.[0]?.message?.content;
   if(typeof content!=="string")throw new Error("Groq returned no analysis content");
   let parsed:unknown;
   try{parsed=JSON.parse(content)}catch{throw new Error("Groq returned invalid JSON")}
   const rawValues=batch?z.object({analyses:z.array(analysisSchema).length(posts.length)}).parse(parsed).analyses:[analysisSchema.parse(parsed)];
   // Treat explicitJobIntent as applicant job-seeking intent, not generic hiring
   // intent. This invariant is enforced server-side even if an LLM misreads it.
   return rawValues.map(validated=>({...validated,explicitJobIntent:validated.classification==="ASPIRING_HELPER"&&validated.explicitJobIntent}));
  }finally{clearTimeout(timeout)}
 }
}

export function createAnalyzerProvider():{provider:AnalyzerProvider;name:"groq"|"mock"}{
 if((process.env.AI_PROVIDER||"").toLowerCase()==="groq"&&process.env.GROQ_API_KEY)
  return {provider:new GroqAnalyzerProvider(),name:"groq"};
 return {provider:new MockAnalyzerProvider(),name:"mock"};
}

/** Placeholder only. Production must validate structured output and keep keys server-side. */
export class OpenAIAnalyzerProvider implements AnalyzerProvider { async analyze(_:PublicResult):Promise<Analysis>{ throw new Error("OpenAI adapter is not activated"); } }
/** Official Meta APIs only: cannot search arbitrary personal posts/private groups. Page messaging requires permissions, review and policy compliance. */
export class FacebookMessengerProvider implements MessagingProvider { async send(_:string):Promise<{externalId:string}>{ throw new Error("Facebook Messenger adapter is not activated"); } }
export class WhatsAppBusinessProvider implements MessagingProvider { async send(_:string):Promise<{externalId:string}>{ throw new Error("WhatsApp Business adapter is not activated"); } }
export class SimulatedMessagingProvider implements MessagingProvider { async send(_:string){return {externalId:`sim_${crypto.randomUUID()}`}} }
export class ApprovedSearchProvider implements SearchProvider { async search(_:SearchInput):Promise<PublicResult[]>{throw new Error("Approved search adapter is not configured")} }
