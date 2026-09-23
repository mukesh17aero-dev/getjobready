// College and employer features, as the marketing pages describe them.

// ------------------------------------------------------- college & employer

// Neither audience has anything built. Both are listed so the shape of the
// product is visible, and every card says plainly that it cannot be opened.
import type { FeatureCategory } from "./types";
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
