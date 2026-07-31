import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
const p=new PrismaClient();
const posts=[
 ["Mira P.","Philippines","APPROVED",91],["Lina K.","Indonesia","PENDING_REVIEW",88],["Asha N.","India","CONTACTED",90],
 ["Dewi R.","Indonesia","INTERESTED",87],["May T.","Myanmar","SCREENING",85],["Nila S.","India","APPLICATION_SUBMITTED",89],
 ["Anu G.","Nepal","DO_NOT_CONTACT",86],["Savi J.","Sri Lanka","REJECTED",82],["K. Applicant",null,"DUPLICATE",78],["Rosa Test","Philippines","INTERVIEW_REVIEW",94]
] as const;
async function seed(){
 await p.auditLog.deleteMany();await p.screeningAnswer.deleteMany();await p.screeningSession.deleteMany();await p.outreachMessage.deleteMany();await p.testApplication.deleteMany();await p.lead.deleteMany();await p.searchRun.deleteMany();await p.user.deleteMany();
 const passwordHash=await bcrypt.hash("admin123",12);
 const admin=await p.user.create({data:{name:"RinzinAgency Admin",email:"admin@gmail.com",passwordHash,role:"ADMIN"}});
 const recruiter=await p.user.create({data:{name:"jimmuel",email:"recruiter@maidhunter.local",passwordHash:await bcrypt.hash("Recruiter123!",12),role:"RECRUITER"}});
 if(process.argv.includes("--users-only")){
  console.log("Seeded users only: admin@gmail.com and recruiter@maidhunter.local");
  return;
 }
 const run=await p.searchRun.create({data:{country:"Philippines",destination:"Singapore",position:"Domestic Helper",language:"English",dateRange:"Past 30 days",generatedQueries:'["looking for domestic helper job Singapore","first-time helper looking for agency"]',resultsFound:16,qualifiedResults:10,createdById:admin.id}});
 const leads=[];for(let i=0;i<posts.length;i++){const [name,country,status,score]=posts[i];leads.push(await p.lead.create({data:{publicDisplayName:name,sourceName:i%2?"Community Careers":"Public Jobs Board",sourceUrl:`https://example.com/seed/${i+1}`,sourcePostTitle:"Looking for domestic-helper work",sourcePostExcerpt:`Prototype public post ${i+1}: I am looking for domestic-helper work in Singapore. Skills include cooking, cleaning and care.`,sourcePublishedAt:new Date(Date.now()-i*86400000),detectedCountry:country,detectedDestination:"Singapore",detectedExperience:"Experience stated",detectedSkills:'["Cooking","Cleaning","Childcare"]',detectedLanguage:"English",classification:"ASPIRING_HELPER",explicitJobIntent:true,confidenceScore:score,aiSummary:"The author explicitly states job-seeking intent. Human review is required.",riskFlags:i===8?'["Possible duplicate"]':"[]",status:status as any,assignedRecruiterId:recruiter.id,registrationToken:crypto.randomBytes(24).toString("hex"),consentToContinue:["INTERESTED","SCREENING","APPLICATION_SUBMITTED","INTERVIEW_REVIEW"].includes(status),doNotContact:status==="DO_NOT_CONTACT",searchRunId:run.id}}))}
 for(const lead of leads.slice(4,6)){const s=await p.screeningSession.create({data:{leadId:lead.id,currentQuestion:8,completed:true,summary:"Candidate completed the prototype screening and described relevant household skills.",recommendedNextStep:"Recruiter review",completedAt:new Date()}});await p.screeningAnswer.create({data:{screeningSessionId:s.id,questionKey:"current_country",questionText:"Which country are you currently living in?",answerText:lead.detectedCountry||"Not stated"}})}
 for(const lead of leads.slice(5,7)){await p.testApplication.create({data:{leadId:lead.id,fullName:`${lead.publicDisplayName} (Test)`,country:lead.detectedCountry||"Not specified",contactMethod:"Test email",contactValue:"candidate@example.com",experience:"Two years (prototype)",overseasExperience:"Yes (prototype)",skills:"Cooking, cleaning, childcare",availability:"Next month",preferredLanguage:"English",consentAccepted:true}})}
 for(const [i,lead] of leads.entries())await p.auditLog.create({data:{userId:i%2?recruiter.id:admin.id,leadId:lead.id,action:"SEED_LEAD_CREATED",details:"Local prototype seed event"}});
 console.log(`Seeded ${leads.length} leads. Admin: admin@gmail.com / admin123`);
}
seed().finally(()=>p.$disconnect());
