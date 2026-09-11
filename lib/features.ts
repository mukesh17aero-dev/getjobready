// The feature catalogue behind each landing page.
//
// A home card now opens a landing page rather than a tool, because a category
// holds several tools and someone arriving needs to know which one is theirs
// before they pick. This file is the list, and it is the single place where a
// feature's build status is recorded.
//
// Status is not decoration. "planned" and "building" both mean a person cannot
// use the thing today, and the UI says so on the card and again in the detail
// panel. Nothing here may claim a capability that does not exist - a landing
// page that oversells is the fastest way to lose somebody on their second
// visit.

export type FeatureStatus =
  /** Shipped. Someone can open it and finish something with it today. */
  | "live"
  /** The route exists and is a placeholder. Being worked on now. */
  | "building"
  /** Specified, not started. */
  | "planned";

/**
 * One section of a feature's walkthrough - the panel beside the list steps
 * through these in order.
 *
 * `art` names a live example rather than holding one: this file is data, and
 * the components that render a resume or an interview read-out live in
 * components/. The panel maps the name to the real renderer, so a walkthrough
 * can never show a document the product does not actually produce.
 */
export type Beat = {
  /** Rail label. One word where possible - it is a signpost, not a summary. */
  tab: string;
  head: string;
  body: string;
  points?: string[];
  art?:
    | "resume-output"
    | "resume-read"
    | "resume-scribe"
    | "resume-ats"
    | "interview-output"
    | "interview-audio"
    | "interview-setup"
    | "interview-answer"
    | "discovery-role"
    | "discovery-chat"
    | "discovery-industries"
    | "discovery-tour"
    | "discovery-shortlist"
    | "readiness-scene"
    | "readiness-help"
    | "readiness-report"
    | "readiness-ai"
    | "story-questions"
    | "story-drafter"
    | "story-grid"
    | "story-refine"
    | "practice-library"
    | "practice-answer"
    | "practice-note"
    | "practice-progress"
    | "fit-dashboard"
    | "fit-paste"
    | "fit-lines"
    | "fit-actions"
    | "profile-compare"
    | "profile-identity"
    | "profile-skills"
    | "profile-keep";
};

export type Feature = {
  id: string;
  title: string;
  /** One line on the card: what it does, in the second person. */
  blurb: string;
  status: FeatureStatus;
  /** Where it opens. Null while it has nowhere to go. */
  href: string | null;
  /** Roughly how long a first pass takes. Null when nobody can say yet. */
  time: string | null;
  /** Detail panel: what the thing actually is. */
  about: string;
  /** Detail panel: who it is for - and, honestly, who it is not for. */
  forWho: string;
  /** Detail panel: what you walk away holding. */
  expect: string;
  /**
   * The full walkthrough, for features that are built. Absent on anything
   * unreleased: "how to read the result" and "what to do next" cannot be
   * written for a thing that produces no result, and inventing them is how a
   * landing page starts lying.
   */
  walkthrough?: Beat[];
};

export type FeatureCategory = {
  id: string;
  /** The category, named as a job to be done rather than a product noun. */
  title: string;
  /** The stake: why this matters, before anything is asked of anyone. */
  stake: string;
  features: Feature[];
};

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  live: "Available now",
  building: "In development",
  planned: "Not released yet",
};

/** Whether a card can be opened at all. */
export const isOpen = (f: Feature): boolean =>
  f.status === "live" && f.href !== null;

// ------------------------------------------------------------------ resume

// Professional Presence, not "Your resume".
//
// Three things live under this heading - the resume, the LinkedIn profile and
// the job fit check - and only one of them is a resume. Naming the whole hub
// after its first tool made the other two look like extras, and left nowhere
// obvious for anything else that shapes what an employer reads about you.
//
// It is deliberately not "career readiness": the assessment under Practice
// already scores somebody's readiness against a role, and two unrelated
// things sharing that word would make both harder to explain.
export const RESUME: FeatureCategory = {
  id: "resume",
  title: "Professional Presence",
  stake:
    "Most applications are filtered before a person reads them. What an employer finds - your resume, your profile, how well you match the job - decides whether anybody sees the rest of you.",
  features: [
    {
      id: "resume-builder",
      title: "Resume Builder",
      blurb: "Write a resume from what you have already told us.",
      status: "live",
      href: "/resume/build",
      time: "15-20 min",
      about:
        "Pick a template, name the role you are aiming at, and fill in the form. The builder writes the resume from your career record, so anything you have already given us is carried in rather than typed again.",
      forWho:
        "Anyone applying for their first few roles. You do not need a finished career history - the builder works from whatever you have, and says what is thin.",
      expect:
        "A resume you can download, and a record we keep so the next version starts where this one ended. Looking through it is free; writing the document needs an account, because it has to belong to somebody.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A complete resume written for one named role, in your choice of three layouts, downloadable as Word or PDF. Most applications are read by screening software before a person sees them, so it is written to get through that and still read well to a hiring manager.",
          art: "resume-output",
        },
        {
          tab: "Who",
          head: "Who it is for, and what it starts from",
          body: "Students and early-career applicants writing a first or second resume. You do not need a work history - it works from a part-time job, a college project or an internship, and says which sections are thin rather than padding them. Upload a PDF, a Word file or a LinkedIn export and it fills itself in; anything it cannot find, it asks for.",
          art: "resume-read",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Three choices and it runs: pick a layout, name the role you are aiming at, and say whether you are starting fresh or improving one you already have. It asks only for details it does not already hold. Once it is written, Scribe changes it in plain words - shorten the summary, put the shop job first - and the page updates as you speak.",
          points: [
            "AI writes each section from your career record, in your own details",
            "Written for one named role, not generically",
            "Every build is checked against screening software",
            "Saved and versioned, so a second role takes minutes",
          ],
          art: "resume-scribe",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "The resume, and a screening check that says how a filter reads it: which skills it found, and what it would trip on - an unexplained gap, a missing month, a qualifier that reads as a weakness. Read the resume aloud and check it sounds like you. Then download it and apply; a second version for a different role takes minutes, because your record is saved.",
          art: "resume-ats",
        },
      ],
    },
    {
      id: "profile-builder",
      title: "LinkedIn Profile Builder",
      blurb: "Make your profile sound professional, without sounding invented.",
      status: "live",
      href: "/profile/professional",
      time: "10-15 min",
      about:
        "A headline, an About section, skills and an open-to line, written from what you have actually done here - and shown beside what you have now, so you can see exactly what changed before anything becomes yours.",
      forWho:
        "Anyone whose profile says where they study rather than what work they are going for - which is most first profiles.",
      expect:
        "One rewrite per section, kept only when you press keep. Where your record does not hold enough to write a section honestly, it says so instead of filling it.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "Your profile laid out the way LinkedIn shows it - headline, About, skills, open-to-work - written from things you have actually done. A LinkedIn optimiser scores a page for search and rewards stuffing it with keywords; that produces a profile that ranks and falls apart in the first phone call.",
          art: "profile-compare",
        },
        {
          tab: "Who",
          head: "Who it is for, and how it starts",
          body: "Anyone whose profile names their college rather than the work they want. Recruiters search the role, so a headline without one is invisible to them. Press improve, and it reads your stories, your practice answers and your record to write one sentence saying who you are professionally. Everything else follows from that sentence.",
          art: "profile-identity",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Tell Scribe what is wrong with it the way you would tell a person - the About is too long, put the store job in the headline, take out anything I cannot back up - and watch the profile change beside you.",
          points: [
            "One identity sentence first, so all four sections agree",
            "No adjectives about you - what you did, not what you are",
            "No skill listed that your record does not show",
            "Leaves a section empty rather than inventing one",
          ],
          art: "profile-skills",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "Nothing is on your profile until you keep it, section by section. Check every line against something you actually did: if a sentence describes somebody slightly better than you, cut it, because that is the sentence you will be asked to expand on. Then paste it into LinkedIn and run a job fit check against a posting you are looking at.",
          art: "profile-keep",
        },
      ],
    },
    {
      id: "job-fit",
      title: "Job Fit Analyzer",
      blurb: "Am I ready for this job? Answered against one posting.",
      status: "live",
      href: "/job-fit",
      time: "2-3 min",
      about:
        "Paste a job advert and see where you already match it and where you do not - each line marked with whether you have proved it, merely claimed it, or have nothing for it at all.",
      forWho: "Anyone deciding which of ten adverts to spend their evening on.",
      expect:
        "A readiness figure for that posting with the four to six lines it was built from, and one thing to do next. It never tells you whether you will get the job - nobody can.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "One posting read against your whole record: what it is actually asking for, what you can prove, what you have only claimed, and what you have nothing for - with a readiness figure for that one job. Applying blind is how people spend six evenings on jobs that were never going to happen.",
          art: "fit-dashboard",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone looking at an advert and unsure whether they are wasting their evening. Paste the responsibilities - the part saying what you would actually be doing. A job title alone is not enough to check anybody against, and it will say so rather than guessing. It is most useful once you have done a few things here; with an empty record it can only tell you the record is empty.",
          art: "fit-paste",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Read the middle column first. Those are the things on your record with nothing behind them, and in an interview they are the questions you will be asked and cannot answer. They are usually the cheapest thing to fix.",
          points: [
            "Proof and claim kept apart - shown against merely stated",
            "The number is arithmetic over those marks, never a model's guess",
            "Every axis points at rows you can go and look at",
            "It says gap where there is one rather than finding something for every line",
          ],
          art: "fit-lines",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "A short list of what to change before you apply, in the order that moves the number, each one pointing at the line in the advert that asks for it. The figure is readiness against this one posting, from your own record - not a chance of being hired, and no caption anywhere will pretend otherwise. Close the gap it named, then run the same posting again.",
          art: "fit-actions",
        },
      ],
    },
  ],
};

// --------------------------------------------------------------- interview

export const INTERVIEW: FeatureCategory = {
  id: "interview",
  title: "Interview practice",
  stake:
    "Interviews are the one part of hiring that is pure performance under pressure, and the only reliable way through it is having said the words out loud before the day.",
  features: [
    {
      id: "ai-interview",
      title: "AI Interview",
      blurb: "A full practice interview, with feedback on what you said.",
      status: "live",
      href: "/interview/practice",
      time: "12-15 min",
      about:
        "Choose your interviewer and the round, name the role, and answer questions written for you rather than pulled off a list. Afterwards you get feedback on what you actually said.",
      forWho:
        "Anyone with an interview coming up, and anyone who freezes in them. It works before you have picked a role, but it is sharper once Discovery has given you one.",
      expect:
        "A transcript, feedback on your answers, and a short list of what to work on that the next interview picks up from. Starting one needs an account, because the feedback is kept.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A full practice interview - questions written for your role, answered by voice or by typing - and a detailed read-out afterwards covering every answer you gave. Interviews are performance under pressure, and the only preparation that transfers is having said the words out loud before the day.",
          art: "interview-output",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone with an interview coming up, and anyone who knows what they want to say and loses it in the room. Check your microphone, name the role, and choose the round and your interviewer. Around twelve minutes, and you can stop partway without losing what you have done.",
          art: "interview-setup",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Questions arrive one at a time. Answer out loud and it transcribes as you speak, or type if you are somewhere you cannot talk. Take the time you would take in a real interview - rushing produces answers you would never actually give.",
          points: [
            "Questions written for your role, not pulled from a bank",
            "Answer by speaking or typing, whichever you have room for",
            "Feedback on what you actually said, quoted back",
            "Two rounds - HR screening and managerial",
          ],
          art: "interview-audio",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "Every answer read back with the marks on it: what to keep, what to add, what to cut - quoted from what you said rather than described in general. The growth areas at the end are what the next interview starts from, so you can see what moved. If they point at gaps in what you can do rather than how you say it, the practice module is where those close.",
          art: "interview-answer",
        },
      ],
    },
    {
      id: "story-bank",
      title: "Interview Story Bank",
      blurb: "Build answers from what you have already proven.",
      // Closed while it is finished. It drafts stories from work that was
      // marked, and the modules producing that work are still being built -
      // so today it would meet most people with a blank shelf and no way to
      // fill it. The card says so rather than opening onto that.
      status: "building",
      href: null,
      // No estimate on something nobody can start: "10-15 min" beside a card
      // that does not open is an invitation to a room with the door shut.
      time: null,
      about:
        "The small number of real examples from your own life that most interview questions are really asking for, written down properly once instead of improvised each time - drafted from what you have actually done here rather than from a blank page.",
      forWho:
        "People who have done things worth talking about and go blank when asked to.",
      expect:
        "Stories in the shape an interviewer expects, each one marked with what it rests on - and a plain admission when your record holds nothing to build one from.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A handful of stories in Situation, Task, Action, Result form, each drawn from something you actually did and labelled with what it rests on. Interviews are largely the same five or six questions wearing different clothes, so four or five good stories cover almost all of them.",
          art: "story-grid",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone who has done things worth talking about and goes blank when asked to - which is most people, and a memory problem rather than an experience problem. Open the questions view: it lists what an interview for your role actually asks, marked with whether you have a story for each. Pick one you have nothing for and press build.",
          art: "story-questions",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "The drafter reads your own record and writes the story from it. Where your record does not say what happened, it leaves that part empty and says so. Read it, then say it out loud once in your own words.",
          points: [
            "Drafted from your simulations and practice answers, not a blank form",
            "Proof and claim kept apart - what you showed against what you said",
            "It leaves a part blank rather than inventing it",
            "Every question shows whether you have anything for it",
          ],
          art: "story-drafter",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "A tightened story with the vague half cut, tagged with what it is evidence of - pressure, ownership, conflict - so the same story comes back for every question it answers. Each carries a mark: proven, yours-unproven, or not-said-yet. Take them into a practice interview and use them under time.",
          art: "story-refine",
        },
      ],
    },
    {
      id: "practice-questions",
      title: "Question library",
      blurb:
        "Practise the questions you will actually be asked, one at a time.",
      status: "live",
      href: "/interview/questions",
      time: "3-5 min a question",
      about:
        "Single questions you can answer whenever you have a few minutes, rather than committing to a full interview - with one note back on each, saying the single thing that would have made it land better.",
      forWho:
        "Anyone who wants to practise in short bursts, or to drill the one question they keep getting wrong.",
      expect:
        "One note per answer, never a report - and sometimes just \u2018that would hold up\u2019, which is a real answer. Every attempt is kept, so the next one has something to be better than.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "The questions an interview for early-career work actually asks, each one saying what it is really testing, and - once you have answered - where you stand on it. Reading questions feels like preparing and is not.",
          art: "practice-library",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone who cannot find a spare ten minutes for a full interview, or who keeps getting caught by the same question and wants to drill just that one. Search or filter by round and by what is being tested, then press any question. The ones you answered badly sit at the top, so the first card is usually the right one.",
          art: "practice-answer",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Type the answer the way you would say it out loud, not the way you would write it. A few sentences is plenty. There is no clock and no limit on attempts - the same question answered three times is the point rather than a failure.",
          points: [
            "Says what each question is really testing, not just what it asks",
            "Sorted worst first - what went badly, then what you never tried",
            "One note back, never a report",
            "Marks the questions your story bank already answers",
          ],
          art: "practice-note",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "One note: the single change that would have made that answer land better. Sometimes it says the answer would hold up and nothing more, which is a real result and not a shrug. Every attempt is kept, so you can see whether practising is working. Take the ones you keep answering badly into a full interview, where they arrive under time and with follow-ups.",
          art: "practice-progress",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------- practice

// Nothing under this heading is finished. The page says so on every card
// rather than linking into placeholder screens, because a tap that lands on
// "this part isn't built yet" is worse than a card that told you first.
export const PRACTICE: FeatureCategory = {
  id: "practice",
  title: "Practice the role",
  stake:
    "Knowing about a job and being able to do it are different things, and only one of them survives contact with a first week. This is where the second one gets built.",
  features: [
    {
      id: "role-readiness",
      title: "Role Readiness Assessment",
      blurb: "Fifteen minutes of the actual work, and what it showed.",
      status: "live",
      href: "/practice/readiness",
      time: "15 min",
      about:
        "Try 12 workplace questions with no time limit. Read the context cards and respond through decisions, messages, priority ordering, handovers or spoken updates. AI assistance is available on questions 1 and 2 only.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A readiness score for the job and a score for each skill your work actually showed, each one quoting the writing that produced it. A resume says what you claim; this says what you did, on work somebody in the job actually does.",
          art: "readiness-report",
        },
        {
          tab: "Who",
          head: "Who it is for, and how it starts",
          body: "Anyone who has chosen a role and would rather find out where they stand now than in front of an employer. You do not need work experience - the situations are the job's own work, explained as you go. Pick the job, read a short onboarding covering the company and who is around you, and press start. The clock does not begin until you do.",
          art: "readiness-scene",
        },
        {
          tab: "How",
          head: "The help beside the work",
          body: "Read a simple question and its context cards, then think through your response. AI assistance is available only on questions 1 and 2, with up to three requests per question. Answer the remaining questions independently. Clipboard actions in answer boxes and tab or window departures are recorded, with a warning; these observations are not automatic cheating findings.",
          points: [
            "Fifteen minutes of the job's own situations, one at a time",
            "AI assistance on the first two questions; your own response throughout",
            "Which situation comes next is chosen from how the last one went",
            "Every result is kept, so you can see what changed",
          ],
          art: "readiness-help",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "The score leads, with the reason beside it, and a reading of how you worked with the AI assistant - taking an answer whole and taking it apart read differently, and both are recorded. A skill the work never called on is left out rather than marked zero: no evidence is not the same as doing badly.",
          art: "readiness-ai",
        },
      ],
      forWho:
        "Anyone who has chosen a role and would rather find out where they stand now than in front of an employer.",
      expect:
        "A score for the role and one for each skill your work showed, each with the reason behind it quoted from what you wrote. Skills you did not get to are left out rather than marked zero. It is a reading of one sitting, and it says so.",
    },
    {
      id: "simulation-missions",
      title: "Simulation Missions",
      blurb: "Real workplace situations, with decisions that carry weight.",
      status: "building",
      href: null,
      time: null,
      about:
        "Short scenarios that put you inside the job rather than describing it - a decision to make, consequences that follow, and marking against what a competent person would have done.",
      forWho:
        "People who learn by doing, and anyone who needs evidence of capability rather than a certificate of attendance.",
      expect:
        "In development. Missions will be scored against the same skills as the readiness assessment, so practice moves the number that matters.",
    },
    {
      id: "career-passport",
      title: "Career Passport",
      blurb: "The record of what you proved, in one place.",
      // Closed again while the work behind it is finished. A passport is
      // sealed from measured work, and the modules that produce that work are
      // still being built - so an open card here would hand somebody an empty
      // booklet with no way to fill it. The route still exists and says so;
      // it is just not offered.
      status: "building",
      href: null,
      time: null,
      about:
        "Everything you have demonstrated, gathered into a single record an employer can look at - not claims about yourself, but things you did that were marked.",
      forWho:
        "Anyone applying without a work history to point at, which is most people applying for their first role.",
      expect:
        "A booklet with your name on it, made the moment you choose a role and filled from your own practice and assessment results, so there is nothing extra to write. Ascend seals it once there is measured work inside, and a sealed passport is the one you can share.",
    },
  ],
};

// ----------------------------------------------------------------- journey

// The whole package, in the order it is meant to be walked. Two of the seven
// are usable today; the line at the top of the page shows which.
// Discovery has a front door now, the same as the resume and the interview.
// One card, because there is one tool. The browsing, the tour and the
// assistant are all inside it - listing them alongside it made four doors
// into the same room and read as more product than there is.
export const DISCOVER: FeatureCategory = {
  id: "discover",
  title: "Discovery",
  stake:
    "Applying for whatever appears is how people end up in jobs that do not fit. This is where you find out what the work actually is - what the day is spent on, what it pays, what is hard about it - before you aim at anything.",
  features: [
    {
      id: "discovery",
      title: "Discovery",
      blurb: "See what the work actually is, then pick the role you want.",
      status: "live",
      href: "/discover",
      time: "15-22 min",
      about:
        "You pick the industries you are curious about and read every role inside them - what the day is actually spent on, what it pays, what is hard about it - then walk a few of them properly and choose one.",
      forWho:
        "Anyone who cannot yet name the job they are aiming at - which is the honest starting position for most people.",
      expect:
        "A shortlist in your own words, and one role you chose. That choice is what makes everything after it specific to you.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A real catalogue of non-technical jobs, opened up: what each day involves, what it pays now and three steps later, where it leads, and what is hard about it. Applying for whatever appears is how people end up in jobs that do not fit.",
          art: "discovery-role",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone who cannot yet name the job they are going for - the ordinary starting position, and the thing every other module depends on you having settled. Pick the industries you are curious about, as many as you like and changeable whenever. Not sure what is in one? Look inside before you pick it.",
          art: "discovery-industries",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Read a few roles, then take the tour of the ones worth a proper look - you choose the stops and how many, one role at a time.",
          points: [
            "Roles from a real catalogue, with real pay ranges",
            "No test and no score - you read the work and decide",
            "A tour you choose the stops for, one role at a time",
            "An assistant on every role, for what the page does not say",
          ],
          art: "discovery-tour",
        },
        {
          tab: "Ask",
          head: "The assistant beside every role",
          body: "The assistant is there at every stop and answers what the page does not: whether the pay holds outside a metro, what the job is like without a degree, what the worst week looks like. Ask it in your own words.",
          art: "discovery-chat",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "The tour ends on a shortlist of the roles you walked, each with what you said about it at the time - your own reason for ruling one in or out, written before you had to defend it. Then choose a role: the readiness assessment measures you against it, practice closes the gaps, and the interview asks its questions.",
          art: "discovery-shortlist",
        },
      ],
    },
  ],
};

export const JOURNEY: FeatureCategory = {
  id: "journey",
  title: "The whole journey",
  stake:
    "Each of these is useful alone. In order, they compound - what you learn in Discovery decides the role, the role decides what you practise, and what you practise is what you end up able to prove.",
  features: [
    // The first stage is the same feature described in DISCOVER, borrowed
    // rather than restated - one description of Discovery, in one place, and
    // one address now that the tool opens on the page it is described on.
    DISCOVER.features[0]!,
    {
      id: "assessment",
      title: "Assessment",
      blurb: "Measure where you stand against the role you picked.",
      status: "building",
      href: null,
      time: null,
      about:
        "The starting-point check: what you can already do for the chosen role, and what is missing.",
      forWho: "Anyone who has finished Discovery and chosen a role.",
      expect:
        "In development. It is the baseline the rest of the journey improves on.",
    },
    {
      id: "practice-stage",
      title: "Practice",
      blurb: "Close the gaps the assessment found.",
      status: "building",
      href: null,
      time: null,
      about:
        "Targeted work on the specific competencies you came up short on, rather than a general course everybody takes.",
      forWho: "Anyone with a measured gap and time to close it.",
      expect:
        "In development. It will be driven by your own assessment results, so no two people get the same set.",
    },
    {
      id: "simulation",
      title: "Simulation",
      blurb: "Do the job before anyone has hired you to.",
      status: "building",
      href: null,
      time: null,
      about:
        "Full task cycles inside a realistic version of the role - the part that turns knowing into having done.",
      forWho: "Anyone who has practised and wants to prove it under pressure.",
      expect:
        "In development. Simulation results are what the Career Passport is built from.",
    },
    {
      id: "passport",
      title: "Career Passport",
      blurb: "Everything you proved, gathered into one record.",
      status: "building",
      href: null,
      time: null,
      about:
        "A record of demonstrated capability that an employer can inspect, rather than a list of claims.",
      forWho: "Anyone applying without a work history to point at.",
      expect: "In development. It assembles itself from what you have done.",
    },
    {
      id: "journey-interview",
      title: "AI Interview",
      blurb: "Say the words out loud before the day.",
      status: "live",
      href: "/interview/practice",
      time: "12-15 min",
      about:
        "A practice interview with questions written for your role, and feedback on what you actually said.",
      forWho:
        "Anyone with an interview coming, and anyone who freezes in them.",
      expect:
        "A transcript, feedback, and a short list of what to work on that the next interview picks up from.",
    },
    {
      id: "job-deployment",
      title: "Job Deployment",
      blurb: "Reach the employers who are looking for what you proved.",
      status: "planned",
      href: null,
      time: null,
      about:
        "The last step: putting a finished, evidenced profile in front of employers searching for exactly that capability.",
      forWho:
        "People who have completed the journey and are ready to be hired.",
      expect:
        "Not released yet. Only learners who opt in will be discoverable, and employers will see evidence rather than claims.",
    },
  ],
};

// ------------------------------------------------------- college & employer

// Neither audience has anything built. Both are listed so the shape of the
// product is visible, and every card says plainly that it cannot be opened.
export const COLLEGE: FeatureCategory = {
  id: "college",
  title: "For colleges",
  stake:
    "Placement outcomes are judged on the cohort, not the individual - which means seeing where a whole year group actually stands, early enough to change it.",
  features: [
    {
      id: "student-dashboards",
      title: "Student Dashboards",
      blurb: "Where each student stands, without asking them.",
      status: "planned",
      href: null,
      time: null,
      about:
        "A per-student view of progress and readiness, drawn from what they have actually done rather than from self-reporting.",
      forWho: "Placement officers and faculty responsible for a cohort.",
      expect:
        "In development. It will read from work students have already been marked on, so there is no extra reporting burden on staff.",
    },
    {
      id: "employability-insights",
      title: "Employability Insights",
      blurb: "What the cohort is strong at, and where it is thin.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Aggregate capability across a year group, mapped to the roles employers are actually hiring for.",
      forWho: "Departments deciding where to spend limited teaching time.",
      expect:
        "In development. Insight will come from scored work rather than surveys, so what it shows is capability rather than confidence.",
    },
    {
      id: "readiness-reports",
      title: "Readiness Reports",
      blurb: "Evidence you can put in front of a recruiter.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Reports on cohort readiness that stand up to scrutiny because they are built from scored work, not attendance.",
      forWho:
        "Institutions that have to show outcomes to employers or regulators.",
      expect:
        "In development. Reports will cite the underlying evidence, so a claim about a cohort can always be traced back to what students actually did.",
    },
    {
      id: "placement-preparation",
      title: "Placement Preparation",
      blurb: "Run the run-up to placement season as a programme.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Structured preparation across a cohort in the weeks before recruiters arrive.",
      forWho: "Placement cells with a season to prepare for and limited staff.",
      expect:
        "In development. It will run on the same modules students already use, so preparation and practice are not separate systems.",
    },
    {
      id: "cohort-analytics",
      title: "Cohort Analytics",
      blurb: "Compare years, courses and interventions.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Trends across cohorts, so a change in teaching can be checked against a change in outcomes.",
      forWho: "Heads of department and placement leadership.",
      expect:
        "In development. Comparisons will be like-for-like across years, because every cohort is scored against the same competency model.",
    },
  ],
};

export const EMPLOYER: FeatureCategory = {
  id: "employer",
  title: "For employers",
  stake:
    "A resume tells you what somebody says they can do. Everything here is about what they were actually observed doing, before you spend an interview slot finding out.",
  features: [
    {
      id: "passport-review",
      title: "Candidate Passport Review",
      blurb: "Look at what a candidate proved, not what they claimed.",
      status: "planned",
      href: null,
      time: null,
      about:
        "The candidate's record of demonstrated capability, with the underlying work available to inspect.",
      forWho: "Hiring managers screening early-career candidates at volume.",
      expect:
        "Not released yet. Only candidates who opt in will be visible, and every claim will link to the work behind it.",
    },
    {
      id: "role-readiness-analytics",
      title: "Role Readiness Analytics",
      blurb: "See how a candidate pool maps to the role you are filling.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Readiness across a candidate pool, scored against the competencies your specific role needs.",
      forWho: "Recruiters filling the same role repeatedly.",
      expect:
        "Not released yet. Scoring will be against the competencies your role needs, not a generic employability index.",
    },
    {
      id: "pre-hire-simulation",
      title: "Pre-Hire Simulation Reports",
      blurb: "Watch how someone handled the job before you hired them.",
      status: "planned",
      href: null,
      time: null,
      about:
        "The replay and marking of a candidate's simulation work, so a hiring decision rests on observed behaviour.",
      forWho:
        "Employers who have been burned by candidates who interview well.",
      expect:
        "Not released yet. You will be able to replay the actual session, not just read a score somebody else assigned.",
    },
    {
      id: "hiring-outcome-tracking",
      title: "Hiring Outcome Tracking",
      blurb: "Check whether the signal actually predicted performance.",
      status: "planned",
      href: null,
      time: null,
      about:
        "Following hires past their start date to see whether the pre-hire evidence held up on the job.",
      forWho:
        "Talent teams accountable for quality of hire, not just time to hire.",
      expect:
        "Not released yet. It is the loop that tells you whether any of the rest of this is worth trusting.",
    },
  ],
};

export const CATEGORIES: Record<string, FeatureCategory> = {
  resume: RESUME,
  interview: INTERVIEW,
  practice: PRACTICE,
  journey: JOURNEY,
  college: COLLEGE,
  employer: EMPLOYER,
};
