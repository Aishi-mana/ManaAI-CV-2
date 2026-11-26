export const QUIET_COMPANY_MS=12_000;
export function chooseQuietCompany(random=Math.random){return random()<.5;}
export function quietCompanyPrompt(partner:string){
 return `NPC conversation: Shared-moment partner: ${partner}. You and your friend are taking a quiet break together by the beanbag. Offer one very short, gentle remark about enjoying the company. Do not start a conversation, ask a question, invent an activity or suggest going somewhere. Silence will follow.`;
}
