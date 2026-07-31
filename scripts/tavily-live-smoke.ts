import "dotenv/config";
import {GroqAnalyzerProvider,TavilySearchProvider} from "../server/providers.js";
const input={country:"Philippines",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 30 days"};
const results=await new TavilySearchProvider().search(input);
console.log(JSON.stringify({stage:"tavily",results:results.length,facebookResults:results.filter(result=>new URL(result.url).hostname.endsWith("facebook.com")).length,sources:[...new Set(results.map(result=>new URL(result.url).hostname))]},null,2));
const analyses=await new GroqAnalyzerProvider().analyzeBatch(results);
const counts=Object.fromEntries([...new Set(analyses.map(item=>item.classification))].map(classification=>[classification,analyses.filter(item=>item.classification===classification).length]));
console.log(JSON.stringify({stage:"groq",analyzed:analyses.length,classifications:counts,qualified:analyses.filter(item=>item.classification==="ASPIRING_HELPER"&&item.explicitJobIntent).length},null,2));
