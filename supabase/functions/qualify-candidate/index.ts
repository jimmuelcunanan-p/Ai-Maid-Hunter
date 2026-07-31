import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const allowed=["Philippines","Indonesia","Myanmar","India","Nepal","Sri Lanka"];
const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
};

function jsonResponse(body:unknown,status=200):Response {
  return new Response(JSON.stringify(body),{
    status,
    headers:{...corsHeaders,"Content-Type":"application/json"},
  });
}

type AiProviderConfiguration = {
  endpoint: string;
  apiKey: string | undefined;
  model: string;
};

function getAiProviderConfiguration(): AiProviderConfiguration {
  const provider=(Deno.env.get("AI_PROVIDER")??"openai").toLowerCase();
  if(provider==="groq"){
    return {
      endpoint:"https://api.groq.com/openai/v1/chat/completions",
      apiKey:Deno.env.get("GROQ_API_KEY"),
      model:Deno.env.get("GROQ_MODEL")??"openai/gpt-oss-20b",
    };
  }
  if(provider==="openai"){
    return {
      endpoint:"https://api.openai.com/v1/chat/completions",
      apiKey:Deno.env.get("OPENAI_API_KEY"),
      model:Deno.env.get("OPENAI_MODEL")??"gpt-4.1-mini",
    };
  }
  throw new Error("Unsupported AI provider");
}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST") return jsonResponse({error:"Method not allowed"},405);
 const auth=req.headers.get("Authorization"); if(!auth) return jsonResponse({error:"Unauthorized"},401);
 const input=await req.json();
 let provider:AiProviderConfiguration;
 try{provider=getAiProviderConfiguration()}catch{return jsonResponse({error:"AI provider is not supported"},503)}
 if(!provider.apiKey) return jsonResponse({error:"AI provider is not configured"},503);
 const system=`You are the candidate qualification agent for AI Maid Hunter. Classify only individuals voluntarily and publicly seeking domestic helper, nanny, caregiver, household worker, childcare, elderly care, or housekeeping employment. Target countries: ${allowed.join(", ")}. Do not infer missing or sensitive information. Reject employers, agencies, advertisements, news, training, and unclear intent. Return JSON only.`;
 const response=await fetch(provider.endpoint,{method:"POST",headers:{"Authorization":`Bearer ${provider.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:provider.model,temperature:0,response_format:{type:"json_schema",json_schema:{name:"qualification",strict:true,schema:{type:"object",additionalProperties:false,required:["qualified","actively_seeking_work","candidate_type","country","job_type","skills","languages","experience_summary","years_experience","singapore_interest","passport_mentioned","available_immediately","full_name","phone","email","public_profile_url","confidence","reason","rejection_reason"],properties:{qualified:{type:"boolean"},actively_seeking_work:{type:"boolean"},candidate_type:{enum:["individual","agency","employer","job_advertisement","unknown"]},country:{anyOf:[{enum:allowed},{type:"null"}]},job_type:{type:["string","null"]},skills:{type:"array",items:{type:"string"}},languages:{type:"array",items:{type:"string"}},experience_summary:{type:["string","null"]},years_experience:{type:["number","null"]},singapore_interest:{type:"boolean"},passport_mentioned:{type:"boolean"},available_immediately:{type:"boolean"},full_name:{type:["string","null"]},phone:{type:["string","null"]},email:{type:["string","null"]},public_profile_url:{type:["string","null"]},confidence:{type:"integer",minimum:0,maximum:100},reason:{type:"string"},rejection_reason:{type:["string","null"]}}}}},messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(input)}]})});
 if(!response.ok) return jsonResponse({error:"Qualification provider failed"},502);
 const json=await response.json();
 return new Response(json.choices[0].message.content,{headers:{...corsHeaders,"Content-Type":"application/json"}});
});
