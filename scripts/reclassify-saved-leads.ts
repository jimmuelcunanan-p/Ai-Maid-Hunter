import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import {enforceApplicantIntent, type Analysis} from "../server/providers.js";

const prisma=new PrismaClient();
const leads=await prisma.lead.findMany({
  where:{classification:"ASPIRING_HELPER",explicitJobIntent:true}
});
let rejected=0;

for(const lead of leads){
  const prior:Analysis={
    classification:"ASPIRING_HELPER",
    explicitJobIntent:true,
    country:lead.detectedCountry,
    destination:lead.detectedDestination,
    experience:lead.detectedExperience,
    skills:JSON.parse(lead.detectedSkills||"[]"),
    detectedLanguage:lead.detectedLanguage||"Unknown",
    confidenceScore:lead.confidenceScore,
    summary:lead.aiSummary,
    riskFlags:JSON.parse(lead.riskFlags||"[]")
  };
  const checked=enforceApplicantIntent({
    name:lead.publicDisplayName,
    title:lead.sourcePostTitle,
    text:lead.sourcePostExcerpt,
    url:lead.sourceUrl,
    source:lead.sourceName,
    publishedAt:lead.sourcePublishedAt
  },prior);
  if(checked.classification==="ASPIRING_HELPER"&&checked.explicitJobIntent)continue;
  await prisma.lead.update({
    where:{id:lead.id},
    data:{classification:checked.classification,explicitJobIntent:false,aiSummary:"Reclassified because the post does not clearly show an individual seeking domestic work."}
  });
  rejected++;
}

console.log(JSON.stringify({checked:leads.length,reclassified:rejected}));
await prisma.$disconnect();
