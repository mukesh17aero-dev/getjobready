export type JourneyActivityType = "heading" | "text" | "callout" | "image" | "video" | "audio" | "quiz" | "flashcard" | "scenario" | "workcase";
export type JourneyQuestion = { id: string; prompt: string; multiple: boolean; explanation: string; options: { id: string; text: string; correct: boolean; weight: number }[] };
export type JourneyActivity = {
  workcase?: WorkCase;
  workcaseVariants?: WorkCase[];
  id: string; type: JourneyActivityType; title: string; instructions: string; body: string;
  mediaUrl: string; captionsUrl: string; mediaPath?: string; captionsPath?: string; renderJobId?: string; altText: string; required: boolean; skillIds: string[];
  storyboard?: import('./learning-studio').LearningStoryboard;
  durationSeconds: number; xp: number; passScore: number; attempts: number; watchedPercent: number;
  cards: { id: string; front: string; back: string }[]; questions: JourneyQuestion[];
};
export type JourneyLesson = { id:string; title:string; sections:{id:string;title:string;activityIds:string[]}[] };
export type LearningJourney = { sources?: {id:string;title:string;owner:string;url:string;rights:string;status:"pending"|"approved"|"blocked"|"withdrawn";reviewedOn:string;reviewDue:string}[]; title: string; description: string; objectives: string[]; language: string; completionXp: number; activities: JourneyActivity[]; lessons?: JourneyLesson[] };
export type JourneyActivityState = { answers: Record<string, string[]>; seen: string[]; position: number; watchedSeconds?: number; textAlternative?: boolean; attempts: number; score: number | null; completed: boolean; revision: number; feedback?: { questionId: string; score: number; explanation: string; correctOptionIds: string[] }[] };
export type LearnerJourneyActivity = Omit<JourneyActivity, "questions" | "workcase" | "workcaseVariants"> & {
  questions: { id: string; prompt: string; multiple: boolean; options: { id: string; text: string }[] }[];
  review?: {id:string;status:"pending"|"upheld"|"invalidated";reason:string;resolution:string|null} | null;
  caseView?: WorkCaseView | null;
  state: JourneyActivityState; locked: boolean;
};
export type LearningJourneyView = Omit<LearningJourney, "activities"> & { readOnly?:boolean; canRetake?:boolean; retakeReason?:string; history?:{id:string;version:number;createdAt:string;completedAt:string|null;current:boolean}[]; roleId: string; version: number; runId: string | null; completedAt: string | null; xp: number; activities: LearnerJourneyActivity[] };
export type LearningJourneySummary = { roleId: string; title: string; description: string; version: number; steps: number; durationSeconds: number; completed: number; status: "Not started" | "In progress" | "Completed" };

export type WorkCase={version:number;mode:'baseline'|'coached'|'verification';equivalenceGroup:string;initialState:string;passScore:number;references:string[];criteria:{id:string;label:string;weight:number;minimumObservations:number;anchors:string[]}[];states:{id:string;description:string;terminal:boolean;actions:{id:string;label:string;nextState:string;consequence:string;coaching:string;criticalError?:string;ratings:{criterionId:string;points:number;evidence:string}[]}[]}[]};
export type WorkCaseView={stateId:string;description:string;completed:boolean;mode:WorkCase['mode'];ruleVersion:number;references:string[];criteria:{id:string;label:string;weight:number;required:number;score:number|null;observations:{points:number;evidence:string;actionId:string}[]}[];criticalErrors:string[];coverageMet:boolean;performanceScore:number|null;verificationPassed:boolean;timeline:{actionId:string;label:string;consequence:string;coaching:string;stateId:string}[];actions:{id:string;label:string}[]};
