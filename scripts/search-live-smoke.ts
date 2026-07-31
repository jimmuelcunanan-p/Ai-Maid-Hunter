import "dotenv/config";
import { createAnalyzerProvider, createSearchProvider, enforceApplicantIntent, matchesSelectedCountry, MockAnalyzerProvider } from "../server/providers.js";

const requestedCountry = process.argv.find(argument => argument.startsWith("--country="))?.slice("--country=".length) || "India";
const requestedLanguage = process.argv.find(argument => argument.startsWith("--language="))?.slice("--language=".length);
const requestedDateRange = process.argv.find(argument => argument.startsWith("--date-range="))?.slice("--date-range=".length);
const languages:Record<string,string>={Philippines:"English",Indonesia:"Bahasa Indonesia",Myanmar:"Burmese",India:"Hindi",Nepal:"Nepali","Sri Lanka":"Sinhala"};
const input = {
  country: requestedCountry,
  region: "Any Indian region",
  platform: "All public sources",
  destination: "Singapore",
  position: "Domestic Helper",
  language: requestedLanguage || languages[requestedCountry] || "English",
  dateRange: requestedDateRange || "Past 30 days",
};

const search = createSearchProvider();
const analyzer = createAnalyzerProvider();

console.log(JSON.stringify({
  searchProvider: search.name,
  searchConfigured: search.configured,
  analyzerProvider: analyzer.name,
  filters: input,
}));

const totalStarted = performance.now();
const searchStarted = performance.now();
const results = await search.provider.search(input);
const searchMs = Math.round(performance.now() - searchStarted);
const aggregate = {
  indiaMentions: results.filter(result => /\bindia(n)?\b|darjeeling|manipur|sikkim|mizoram|arunachal|assam|gorkha/i.test(`${result.title} ${result.text}`)).length,
  applicantIntentMentions: results.filter(result => /looking for (a )?(job|work)|seeking (work|employment)|need (a )?job/i.test(`${result.title} ${result.text}`)).length,
  agencyMentions: results.filter(result => /\bagency\b|maids? available|helpers? available|we provide|hiring/i.test(`${result.title} ${result.text}`)).length,
  sourceDomains: [...new Set(results.map(result => result.source))],
};
if(process.argv.includes("--details"))console.log(JSON.stringify(results.map(result=>({source:result.source,title:result.title,text:result.text.slice(0,240)}))));
if (process.argv.includes("--search-only")) {
  console.log(JSON.stringify({ results: results.length, searchMs, aggregate }));
  process.exit(0);
}

const analysisStarted = performance.now();
let usedFallback = false;
let rawAnalyses;
try {
  const providerWork = analyzer.provider.analyzeBatch
    ? analyzer.provider.analyzeBatch(results)
    : Promise.all(results.map(result => analyzer.provider.analyze(result)));
  rawAnalyses = await Promise.race([
    Promise.resolve(providerWork),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Groq classification exceeded 20 seconds")), 20_000)),
  ]);
} catch {
  usedFallback = true;
  const fallback = new MockAnalyzerProvider();
  rawAnalyses = await Promise.all(results.map(result => fallback.analyze(result)));
}
const analyses = rawAnalyses.map((analysis, index) => enforceApplicantIntent(results[index], analysis));
const analysisMs = Math.round(performance.now() - analysisStarted);
const qualified = analyses.filter(
  analysis =>
    analysis.classification === "ASPIRING_HELPER" &&
    analysis.explicitJobIntent &&
    matchesSelectedCountry(input,analysis),
).length;

console.log(JSON.stringify({
  results: results.length,
  qualified,
  usedFallback,
  searchMs,
  analysisMs,
  totalMs: Math.round(performance.now() - totalStarted),
  aggregate,
}));
process.exit(0);
