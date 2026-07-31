import "dotenv/config";
import {GroqAnalyzerProvider} from "../server/providers.js";
const analyzer=new GroqAnalyzerProvider();
const base={name:"Fictional Test User",title:"Public test post",url:"https://example.com/groq-smoke",source:"Mock Search",publishedAt:new Date()};
const applicant=await analyzer.analyze({...base,text:"I am looking for a domestic helper job in Singapore. I have childcare and cooking experience."});
const employer=await analyzer.analyze({...base,url:"https://example.com/groq-smoke-employer",text:"Our family is looking for a domestic helper for childcare."});
console.log(JSON.stringify({
 provider:"groq",
 model:process.env.GROQ_MODEL,
 applicant:{classification:applicant.classification,explicitJobIntent:applicant.explicitJobIntent,confidence:applicant.confidenceScore},
 employer:{classification:employer.classification,explicitJobIntent:employer.explicitJobIntent,confidence:employer.confidenceScore}
},null,2));
if(applicant.classification!=="ASPIRING_HELPER"||!applicant.explicitJobIntent||employer.classification!=="EMPLOYER"||employer.explicitJobIntent)
 throw new Error("Groq classification smoke test failed");
