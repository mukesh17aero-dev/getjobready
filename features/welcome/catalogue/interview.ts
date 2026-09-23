// Interview features, as the marketing pages describe them.

// --------------------------------------------------------------- interview

import type { FeatureCategory } from "./types";
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
