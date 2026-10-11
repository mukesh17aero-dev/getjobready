import type {LearningJourney} from '@/lib/api/simulation-journey';
import { API_URL, requestHeaders } from '@/lib/api';
import { supabaseBrowser } from '@/lib/supabase-browser';
export type WorkTask = {
    id: string;
    title: string;
    brief: string;
    cards: {
        title: string;
        body: string;
    }[];
    deliverable: string;
    criteria: {
        id: string;
        description: string;
        critical: boolean;
    }[];
};
export type YouTubeCandidate={audioLanguage?:string;audienceNote?:string;matchReason?:string;query:string;whyRelevant:string;videoId:string;title:string;channelTitle:string;viewCount:number|null;durationSeconds:number;thumbnailUrl:string;fetchedAt:string;reviewed:false};
export type SkillModule = {
    youtubeCandidates?: YouTubeCandidate[];
    skillId: string;
    title: string;
    objective: string;
    lesson: {
        explanation: string;
        steps: string[];
        workedExample: string;
        commonMistakes: string[];
        illustration: {
            title: string;
            body: string;
        }[];
    };
    video: {
        durationSeconds: number;
        scenes: {
            seconds: number;
            visual: string;
            narration: string;
        }[];
        renderId?: string;
        assetUrl?: string;
        captionsUrl?: string;
        reviewed: boolean;
    };
    youtube: {
        englishReviewed?: boolean;
        query: string;
        whyRelevant: string;
        videoId?: string;
        startSeconds?: number;
        endSeconds?: number;
        title?: string;
        reviewed: boolean;
    }[];
    missions: (WorkTask & {
        stage: string;
        hint: string;
        feedbackFocus: string;
    })[];
    baseline: WorkTask[];
    reassessment: WorkTask[];
    variants: {
        id: string;
        baseline: WorkTask[];
        reassessment: WorkTask[];
    }[];
};
export type RoleIntroduction=Pick<SkillModule,'title'|'objective'|'lesson'|'video'>&{responsibilities:string[];recruiterExpectations:string[]};
export type RolePackage = {
    introduction?:RoleIntroduction;
    roleId: string;
    roleTitle: string;
    sector: string;
    context: string;
    sourceDigest: string;
    skills: {
        id: string;
        name: string;
        description: string;
        importance: number;
    }[];
    modules: SkillModule[];
    learningJourney?: LearningJourney;
    policy: {
        questionCount: 12;
        timeLimit: null;
        aiAssistLimit: 2;
        rubricVersion: string;
    };
    staleSkillIds: string[];
    reviewerNotes: string;
};
export type StoredPackage = {
    role_id: string;
    revision: number;
    data: RolePackage;
    updated_at: string;
};
export type StudioCatalogue = {
    testApprovalBypass: boolean;
    youtubeConfigured: boolean;
    roles: {
        id: string;
        title: string;
        world: string;
        summary: string;
        skills: {
            id: string;
            name: string;
            description: string;
        }[];
        package: StoredPackage | null;
        published?: {version:number;is_test:boolean}|null;
    }[];
    prompt: string;
};
export type ReviewRequest = {
    id: string;
    resource: string;
    digest: string;
    snapshot: unknown;
    title: string;
    author_email: string;
    requested_by: string;
    state: string;
    created_at: string;
    approvals: number;
    required: number;
    blocked: boolean;
    ready: boolean;
    events: {
        actor_email: string;
        decision: string;
        comment: string;
        created_at: string;
    }[];
};
export type ReviewInbox = {
    reviews: ReviewRequest[];
    notifications: {
        id: string;
        review_id: string;
        title: string;
        message: string;
        read_at: string | null;
        email_status: string;
        last_error: string | null;
    }[];
    reviewerCount: number;
    canReview: boolean;
    emailConfigured: boolean;
    testApprovalBypass: boolean;
};
export async function studioRequest<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await supabaseBrowser().auth.getSession();
    if (!data.session) {
        window.location.assign('/login?next=' + encodeURIComponent(window.location.pathname));
        throw new Error('Sign in to continue.');
    }
    const response = await fetch(`${API_URL}/v1/admin${path}`, { method: body === undefined ? 'GET' : 'POST', headers: requestHeaders({ token: data.session.access_token, json: body !== undefined }), body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.status === 401) {
        window.location.assign('/login?next=' + encodeURIComponent(window.location.pathname));
        throw new Error('Your session expired. Sign in again.');
    }
    const json = await response.json().catch(() => null);
    if (!response.ok)
        throw new Error(json?.error ?? 'The server could not complete this action. Please retry.');
    return json as T;
}

export type GenerationPlan = {
    total: number;
    completed: number;
    remaining: number;
    steps: {skillId: string; skillName: string; action: 'generate' | 'variant' | 'introduction'; label: string}[];
};
export type GenerationResult = {package: StoredPackage; plan: GenerationPlan};

export type VideoJob = {attempts:number;id:string;roleId:string;skillId:string;state:string;phase:string;error:string|null;createdAt:string;updatedAt:string};
export type VideoPreviewResult = VideoJob & {media:{video:string;captions:string;poster:string;illustrations:string[];durationSeconds:number}|null};
