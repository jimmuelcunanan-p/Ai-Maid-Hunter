import "dotenv/config";
import {GroqAnalyzerProvider,MockSearchProvider} from "../server/providers.js";
const search=new MockSearchProvider(),analyzer=new GroqAnalyzerProvider();
const results=await search.search({country:"Philippines",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 30 days"});
const analyses=await analyzer.analyzeBatch(results);
const summary=analyses.map((analysis,index)=>({index:index+1,title:results[index].title,classification:analysis.classification,intent:analysis.explicitJobIntent,confidence:analysis.confidenceScore}));
console.log(JSON.stringify(summary,null,2));
if(!summary.some(x=>x.classification==="ASPIRING_HELPER")||!summary.some(x=>x.classification==="EMPLOYER"))
 throw new Error("Groq batch did not distinguish applicants from employers");
