export const transitions:Record<string,string[]> = {
  SEARCH_RESULT:["PENDING_REVIEW"], PENDING_REVIEW:["APPROVED","REJECTED","DUPLICATE","ARCHIVED"],
  APPROVED:["CONTACT_READY","ARCHIVED"], CONTACT_READY:["CONTACTED","ARCHIVED"], CONTACTED:["INTERESTED","NOT_INTERESTED","NO_RESPONSE","DO_NOT_CONTACT","ARCHIVED"],
  INTERESTED:["SCREENING","ARCHIVED"], SCREENING:["APPLICATION_SUBMITTED","ARCHIVED"], APPLICATION_SUBMITTED:["INTERVIEW_REVIEW","ARCHIVED"],
  INTERVIEW_REVIEW:["ARCHIVED"], NO_RESPONSE:["ARCHIVED"], NOT_INTERESTED:["ARCHIVED","DO_NOT_CONTACT"], DO_NOT_CONTACT:["ARCHIVED"], REJECTED:["ARCHIVED"], DUPLICATE:["ARCHIVED"]
};
export function assertTransition(from:string,to:string){if(!transitions[from]?.includes(to)) throw Object.assign(new Error(`Invalid status transition: ${from} → ${to}`),{status:409});}
export const screeningQuestions=[
  ["current_country","Which country are you currently living in?"],["singapore_interest","Are you interested in domestic-helper work in Singapore?"],
  ["helper_experience","Have you worked as a domestic helper before?"],["overseas_experience","Have you previously worked overseas?"],
  ["skills","Which duties or care skills do you have?"],["availability","When are you available?"],["language","Which language do you prefer?"],
  ["continue","Would you like to continue to the test application?"]
] as const;
