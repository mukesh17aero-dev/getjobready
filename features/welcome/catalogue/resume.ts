// Resume features, as the marketing pages describe them.

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
import type { FeatureCategory } from "./types";
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
