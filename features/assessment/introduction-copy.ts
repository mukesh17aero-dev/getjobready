/** Shared by the introduction, transcript and the locally rendered captioned film. */
export const assessmentIntroduction = [
  { title: "Try a workplace situation", text: "You do not need previous work experience. You will respond to a situation at a fictional workplace. Show how you think and explain your decision." },
  { title: "Read the context cards", text: "The cards contain the messages, facts and rules for your question. Read them before answering. Use the information provided, without looking things up elsewhere." },
  { title: "Unfamiliar word?", text: "Open Words in this question for a plain-language definition. For example, a support ticket is a record of a customer problem and the steps taken to help." },
  { title: "Use your own words", text: "Choose an action and explain why, or write a short response as requested. Some questions ask for a spoken update. Clear, everyday language is enough." },
  { title: "Start when you are ready", text: "Watch this guide or read the same introduction as text. Read the instructions on this page, then press Start when you are ready. AI assistance is available only on the first two questions. Stay in the assessment tab while answering." },
] as const;

export const assessmentRoleContext: Record<string, string> = {
  guest_experience_associate: "Help guests with bookings, questions and problems during their visit.",
  relationship_executive: "Understand a customer’s needs, explain suitable services and follow up on their requests.",
  hub_supervisor: "Help a delivery or warehouse team organise its work and resolve problems during a shift.",
  operations_executive: "Keep everyday work accurate and moving, from customer requests to stock and records.",
  operations_coordinator: "Coordinate people, orders and updates so work reaches the right person on time.",
  customer_success_associate: "Help customers use a product or service, resolve problems and get useful results.",
};
