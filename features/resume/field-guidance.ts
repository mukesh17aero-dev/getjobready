// What to write in each resume field, shown behind its ⓘ.
//
// One short note under every input read as filler and was skipped. This holds
// the same guidance properly: what a recruiter and an applicant-tracking
// system (ATS) look for, examples written to market standard, what to leave
// out, and the field's limits. Examples follow one pattern - a strong action
// verb, what was done, its scale and a true result - use standard section
// words an ATS recognises, and carry no filler ("hardworking", "passionate")
// and none of the personal details recruiters now ask to leave off.
//
// Examples are for a student or first job and for an early professional, and
// where the target role falls in a known family, for that kind of work. Every
// name, employer and number in them is a sample.

export type GuideTrack = "student" | "early_career";
export type RoleFamily = "support" | "operations" | "sales" | "banking" | "logistics" | "tech" | "general";
type Examples = { student: string[]; early_career: string[] };

export type FieldGuide = {
  title: string;
  expected: string[];
  examples: Partial<Record<RoleFamily, Examples>> & { general: Examples };
  avoid?: string[];
  limits?: string;
};

export const FAMILY_LABEL: Record<RoleFamily, string> = {
  support: "Customer support",
  operations: "Operations",
  sales: "Sales and retail",
  banking: "Banking and finance",
  logistics: "Logistics and warehousing",
  tech: "Technology",
  general: "Any role",
};

/** The kind of work a target role is, from its title. Banking before sales: "Relationship Executive" is a bank role. */
export function roleFamily(role: string | null | undefined): RoleFamily {
  const r = (role ?? "").toLowerCase();
  if (!r.trim()) return "general";
  if (/bank|relationship|loan|credit|insurance|finance|accounts?\b|kyc/.test(r)) return "banking";
  if (/engineer|developer|devops|software|data|analyst|\bit\b|cloud|qa|tester/.test(r)) return "tech";
  if (/logistic|hub|warehouse|supply|deliver|dispatch|inventory|fleet/.test(r)) return "logistics";
  if (/customer|support|success|service|help ?desk|call|bpo|chat|voice/.test(r)) return "support";
  if (/sales|retail|store|business development|counter|merchandis/.test(r)) return "sales";
  if (/operation|coordinator|admin|back office|process|executive/.test(r)) return "operations";
  return "general";
}

const same = (lines: string[]): Examples => ({ student: lines, early_career: lines });

export const FIELD_GUIDES = {
  "header.name": {
    title: "Full name",
    expected: ["Your first and last name, as on your certificates and ID.", "This is the largest line on the page, so spell it exactly as you want employers to use it."],
    examples: { general: same(["Aarav Sharma", "Priya Nair"]) },
    avoid: ["Titles such as Mr., Ms. or Er.", "Nicknames or initials only.", "The word 'Resume' or 'CV' as a heading."],
    limits: "Needed to save your draft. Up to 80 characters.",
  },
  "header.email": {
    title: "Email",
    expected: ["A plain, professional address you check every day.", "firstname.lastname works best; add a number only if that is taken."],
    examples: { general: same(["aarav.sharma@gmail.com", "priya.nair92@outlook.com"]) },
    avoid: ["Nicknames or jokes in the address.", "A college email that stops working after you graduate."],
    limits: "Needed to download. Up to 120 characters.",
  },
  "header.phone": {
    title: "Phone",
    expected: ["One mobile number with the country code, on which you answer unknown callers."],
    examples: { general: same(["+91 98765 43210"]) },
    avoid: ["Two or three numbers.", "A landline nobody answers during the day."],
    limits: "Up to 40 characters.",
  },
  "header.city": {
    title: "City",
    expected: ["Where you live, as city and state, so a recruiter can see you are local or willing to move.", "If you are relocating, give the city you are moving to."],
    examples: { general: same(["Pune, Maharashtra", "Hyderabad, Telangana"]) },
    avoid: ["Your full street address or PIN code.", "Date of birth, gender, religion, marital status or a photo - recruiters now ask for these to be left off."],
    limits: "Up to 80 characters.",
  },
  "header.link": {
    title: "LinkedIn or portfolio",
    expected: ["One link that shows your work: a LinkedIn profile with a short custom address, or a portfolio or GitHub for technical roles."],
    examples: { general: same(["linkedin.com/in/aarav-sharma", "github.com/priya-nair"]) },
    avoid: ["Long links with tracking codes.", "Personal social media such as Instagram or Facebook."],
    limits: "One link. Up to 160 characters.",
  },
  "summary.heading": {
    title: "Section heading",
    expected: ["A standard heading, so screening software files the paragraph correctly.", "'Professional Summary' once you have work experience; 'Career Objective' or 'Profile' for a student."],
    examples: { general: { student: ["Career Objective", "Profile"], early_career: ["Professional Summary", "Summary"] } },
    avoid: ["Creative headings such as 'About Me' or 'My Story'."],
    limits: "Up to 40 characters.",
  },
  "summary.text": {
    title: "Your introduction",
    expected: [
      "Two to four lines, read in about six seconds.",
      "Open with the role and your level, then two or three skills the job asks for, then one result with a true number.",
      "Use the job description's own words for skills you really have - screening software matches on them.",
      "Avoid 'I' and 'my': start straight with who you are.",
    ],
    examples: {
      support: {
        student: ["Commerce graduate with customer-facing experience from a six-month part-time billing role. Resolved walk-in queries for 80+ customers a week and processed refunds within store policy. Fluent in English, Hindi and Telugu; comfortable with Excel and CRM data entry."],
        early_career: ["Customer Support Associate with 2 years in voice and chat support for a fintech app. Handled 60+ tickets a day at a 92% first-contact resolution rate while keeping CSAT above 4.5/5. Skilled in Zendesk, escalation handling and clear written replies."],
      },
      operations: {
        student: ["B.Com final-year student with operations experience from running a three-day college fest for 1,500 visitors. Coordinated 12 volunteers, vendor schedules and a ₹2 lakh budget tracked in Google Sheets. Strong in Excel, documentation and follow-through."],
        early_career: ["Operations Executive with 18 months managing daily order processing for an e-commerce seller. Cut order-to-dispatch time from 48 to 24 hours by reorganising pick lists. Experienced in MIS reporting, vendor coordination and Excel (VLOOKUP, pivot tables)."],
      },
      sales: {
        student: ["BBA graduate with retail sales experience from a four-month internship at an electronics store. Reached 110% of the monthly accessories target and set up a weekend display that lifted walk-ins. Confident with customers in English, Hindi and Kannada."],
        early_career: ["Retail Sales Associate with 2 years in apparel retail. Consistently reached 105-120% of monthly targets and trained 4 new joiners on billing and returns. Skilled in upselling, POS billing and visual merchandising."],
      },
      banking: {
        student: ["B.Com graduate focused on banking, with a two-month internship at a cooperative bank branch. Opened 40+ savings accounts with complete KYC and explained deposit products to walk-in customers. Proficient in Excel and Tally."],
        early_career: ["Relationship Executive with 2 years in retail banking. Managed a portfolio of 250 customers, grew deposits by ₹1.2 crore and sold insurance and SIP products within compliance guidelines. Skilled in KYC, CASA acquisition and cross-selling."],
      },
      logistics: {
        student: ["Diploma holder in logistics with a three-month warehouse internship. Supported inbound checks for 300+ SKUs a day and cut counting errors by keeping a daily discrepancy log. Comfortable with barcode scanners and Excel."],
        early_career: ["Hub Supervisor with 2 years running a last-mile delivery hub of 25 riders. Kept on-time delivery above 96% and cut misroutes by 30% with a pre-dispatch scan check. Skilled in shift planning, rider onboarding and safety audits."],
      },
      tech: {
        student: ["Computer Science graduate with hands-on Linux and cloud projects. Built a Jenkins pipeline that tested and deployed a Flask app to AWS EC2 on every push. Comfortable with Python, Bash, Docker and Git."],
        early_career: ["DevOps Engineer with 1 year supporting production infrastructure. Automated deployments with Jenkins and Docker, cutting release time from 2 hours to 20 minutes, and set up Splunk alerts that halved incident detection time. Skilled in AWS, Kubernetes and Python scripting."],
      },
      general: {
        student: ["B.Com graduate with hands-on experience from a part-time role and college events. Coordinated a team of 8 volunteers for a 1,200-visitor fest and kept the event within its budget. Skilled in Excel, written communication and English, Hindi and Tamil."],
        early_career: ["Executive with 2 years in a customer-facing role. Handled 50+ customer requests a day and reduced repeat complaints by 20% by fixing a billing step. Skilled in Excel, CRM tools and clear written communication."],
      },
    },
    avoid: ["'Hardworking', 'passionate', 'team player', 'go-getter' - recruiters skip these.", "'Seeking a challenging role in a reputed organisation.'", "Your salary expectations, family details or personal goals."],
    limits: "Needed to download. Up to 700 characters.",
  },
  "experience.heading": {
    title: "Section heading",
    expected: ["A standard heading screening software recognises."],
    examples: { general: { student: ["Experience", "Internships and Projects"], early_career: ["Work Experience", "Professional Experience"] } },
    avoid: ["Creative headings such as 'My Journey'."],
    limits: "Up to 40 characters.",
  },
  "experience.title": {
    title: "Role or position",
    expected: ["Your exact job title, as on your offer letter.", "For college work, the role you actually played.", "If the job you want uses a different name for the same work, you may use that name only when it is still true."],
    examples: { general: { student: ["Billing Intern", "Event Coordinator, Annual College Fest", "Volunteer, National Service Scheme"], early_career: ["Customer Support Associate", "Operations Executive", "Hub Supervisor"] } },
    avoid: ["A bigger title than you held.", "The company name in this field."],
    limits: "Up to 80 characters.",
  },
  "experience.organisation": {
    title: "Employer or organisation",
    expected: ["The organisation's full name and the city.", "For college work, the college or club."],
    examples: { general: { student: ["Osmania University, Hyderabad", "NSS Unit, St. Joseph's College"], early_career: ["Lumen Retail Pvt Ltd, Bengaluru", "Northwind Logistics, Pune"] } },
    avoid: ["Abbreviations only a few people know."],
    limits: "Up to 90 characters.",
  },
  "experience.period": {
    title: "Dates",
    expected: ["Month and year for start and end, in the same format everywhere on the page.", "Use 'Present' for a job you still hold."],
    examples: { general: same(["Jun 2024 – Present", "Mar 2023 – Aug 2023"]) },
    avoid: ["Only a duration such as '2 years'.", "Mixing formats such as '06/24' and 'June 2024'."],
    limits: "Up to 40 characters.",
  },
  "experience.bullets": {
    title: "What you did",
    expected: [
      "Three to five points, most important first.",
      "Each one: a strong action verb, what you did, how much or how many, and the result.",
      "Numbers are what make a recruiter stop - use them only when they are true.",
      "Use the job description's words for the work you really did; screening software matches on them.",
    ],
    examples: {
      support: {
        student: ["Resolved 80+ walk-in customer queries a week at the billing counter, keeping average wait under 5 minutes.", "Processed refunds and exchanges within store policy and logged each in the daily register.", "Trained 2 new part-timers on the billing system during the festive season."],
        early_career: ["Handled 60+ voice and chat tickets a day with a 92% first-contact resolution rate.", "Kept CSAT above 4.5/5 for 6 consecutive months by writing clear follow-up replies.", "Reduced escalations by 18% by building a quick-reference guide for common billing issues."],
      },
      operations: {
        student: ["Coordinated 12 volunteers across registration, stalls and stage for a 1,500-visitor college fest.", "Tracked a ₹2 lakh event budget in Google Sheets and closed it with no overspend.", "Scheduled 9 vendors and confirmed every delivery a day ahead."],
        early_career: ["Processed 300+ e-commerce orders a day from receipt to dispatch.", "Cut order-to-dispatch time from 48 to 24 hours by reorganising pick lists by aisle.", "Prepared the daily MIS report in Excel (pivot tables, VLOOKUP) used by the regional manager."],
      },
      sales: {
        student: ["Reached 110% of the monthly accessories sales target during a 4-month internship.", "Set up a weekend product display that brought more walk-ins to the counter.", "Explained warranty and EMI options to customers in English, Hindi and Kannada."],
        early_career: ["Reached 105-120% of monthly sales targets for 8 of 12 months.", "Raised average bill value by 15% by suggesting matching accessories at checkout.", "Trained 4 new joiners on POS billing, returns and display standards."],
      },
      banking: {
        student: ["Opened 40+ savings accounts with complete KYC documentation during a 2-month branch internship.", "Explained fixed deposit and recurring deposit options to walk-in customers.", "Updated customer records in the core banking system with no data-entry errors."],
        early_career: ["Managed a portfolio of 250 retail customers and grew deposits by ₹1.2 crore in a year.", "Sold insurance and SIP products to 60+ customers within compliance guidelines.", "Completed KYC and account opening for 30+ CASA accounts a month."],
      },
      logistics: {
        student: ["Checked inbound stock for 300+ SKUs a day during a 3-month warehouse internship.", "Cut counting errors by keeping a daily discrepancy log reviewed with the supervisor.", "Labelled and shelved returns using barcode scanners and the warehouse system."],
        early_career: ["Ran daily operations for a last-mile hub of 25 riders, keeping on-time delivery above 96%.", "Cut misrouted parcels by 30% by adding a pre-dispatch scan check.", "Onboarded and trained 10 new riders on route planning and safety rules."],
      },
      tech: {
        student: ["Built a Jenkins pipeline that ran tests and deployed a Flask app to AWS EC2 on every push.", "Containerised a three-service college project with Docker Compose.", "Wrote Bash scripts to back up a MySQL database daily to S3."],
        early_career: ["Automated deployments with Jenkins and Docker, cutting release time from 2 hours to 20 minutes.", "Set up Splunk alerts that halved the time to detect production incidents.", "Managed Kubernetes workloads for 12 services and documented the on-call runbook."],
      },
      general: {
        student: ["Coordinated a team of 8 volunteers for a 1,200-visitor college event.", "Kept the event within its ₹1.5 lakh budget using a shared Google Sheet.", "Handled sponsor follow-ups and confirmed 5 sponsors before the deadline."],
        early_career: ["Handled 50+ customer requests a day across phone and email.", "Reduced repeat complaints by 20% by fixing a step in the billing process.", "Prepared a weekly Excel report used by the team lead to plan staffing."],
      },
    },
    avoid: ["'Responsible for', 'Worked on', 'Helped with' - say what you did.", "'I' and 'my'.", "Long paragraphs; one point per line.", "Numbers you cannot explain in an interview."],
    limits: "Up to 5 points, one per line, 220 characters each.",
  },
  "experience.scope": {
    title: "Scope and responsibilities",
    expected: ["How big the work was: team size, number of customers, budget, sites or shifts you covered."],
    examples: { general: same(["Led a team of 6 across morning and evening shifts.", "Covered 3 stores in the Koramangala cluster."]) },
    avoid: ["A list of duties with no size."],
  },
  "experience.tools": {
    title: "Tools used",
    expected: ["The software and equipment you used, named exactly - screening software looks for them."],
    examples: { general: same(["Excel (pivot tables, VLOOKUP), Zendesk, Tally", "Jenkins, Docker, AWS EC2, Splunk"]) },
    avoid: ["'Computer knowledge' or 'MS Office' without saying what you did with it."],
  },
  "experience.outcome": {
    title: "Achievements and outcomes",
    expected: ["What changed because of your work, with a number if it is true."],
    examples: { general: same(["Cut order-to-dispatch time from 48 to 24 hours.", "Rated top performer of the quarter out of 20 agents."]) },
    avoid: ["Outcomes you cannot explain or prove in an interview."],
  },
  "experience.evidence": {
    title: "Evidence source",
    expected: ["Where the result can be checked: a report, a dashboard, an award letter or a reference."],
    examples: { general: same(["Monthly MIS report, Q3 2024", "Employee of the Month certificate, March 2025"]) },
  },
  "experience.kind": {
    title: "What kind",
    expected: ["The kind of work this was. It decides how the entry is labelled on your resume: a job, an internship, a project or volunteering."],
    examples: { general: { student: ["College project", "Internship", "Volunteering"], early_career: ["Job", "Internship", "Freelance"] } },
  },
  "education.qualification": {
    title: "What you studied",
    expected: ["The full name of the course and its specialisation, and the board for school results."],
    examples: { general: same(["B.Com (Computer Applications)", "Class XII (Commerce), CBSE", "Diploma in Logistics Management"]) },
    avoid: ["Abbreviations alone when the full name is clearer."],
    limits: "Up to 90 characters.",
  },
  "education.institution": {
    title: "Where",
    expected: ["The full name of the college, university or school, and the city."],
    examples: { general: same(["Osmania University, Hyderabad", "St. Joseph's College, Bengaluru"]) },
    limits: "Up to 90 characters.",
  },
  "education.period": {
    title: "Dates",
    expected: ["Start and end years. For a course you are still on, give the year you expect to finish."],
    examples: { general: same(["2021 – 2024", "2022 – Present (expected May 2025)"]) },
    avoid: ["Leaving out dates entirely - it makes recruiters guess."],
    limits: "Up to 40 characters.",
  },
  "education.detail": {
    title: "Additional details",
    expected: ["Your marks or CGPA if they help you, and coursework or honours that match the job."],
    examples: { general: same(["CGPA 8.1/10", "Relevant coursework: Financial Accounting, Business Statistics", "University rank 3 in Cost Accounting"]) },
    avoid: ["Every subject you studied.", "Marks below 60% unless the employer asks for them."],
    limits: "Up to 120 characters.",
  },
  "education.marks": {
    title: "Marks or CGPA",
    expected: ["Percentage or CGPA as on your marksheet. Optional - include it when it helps you."],
    examples: { general: same(["78%", "8.1/10 CGPA"]) },
  },
  "skills.group": {
    title: "Group name",
    expected: ["Plain group names that screening software understands."],
    examples: { general: same(["Technical Skills", "Tools", "Customer Service", "Languages"]) },
    avoid: ["Creative names such as 'My Superpowers'."],
    limits: "Up to 40 characters.",
  },
  "skills.items": {
    title: "Skills",
    expected: [
      "Six to twelve skills, the hard skills first.",
      "Use the exact terms from the job description for skills you really have.",
      "Name the tool and what you can do with it.",
    ],
    examples: {
      support: same(["Customer query resolution", "Zendesk", "Escalation handling", "Email and chat support", "MS Excel", "English, Hindi"]),
      operations: same(["Order processing", "MIS reporting", "MS Excel (pivot tables, VLOOKUP)", "Vendor coordination", "Inventory tracking", "Google Sheets"]),
      sales: same(["Upselling and cross-selling", "POS billing", "Visual merchandising", "Target achievement", "Customer relationship building", "Product demonstration"]),
      banking: same(["KYC documentation", "CASA acquisition", "Cross-selling insurance and SIPs", "Core banking systems", "Tally", "MS Excel"]),
      logistics: same(["Last-mile delivery operations", "Inventory control", "Barcode scanning", "Shift planning", "Safety audits", "MS Excel"]),
      tech: same(["Jenkins", "Docker", "Kubernetes", "AWS (EC2, S3)", "Python", "Bash scripting", "Splunk", "Git"]),
      general: same(["MS Excel", "Google Sheets", "Customer communication", "Report writing", "Data entry", "English, Hindi"]),
    },
    avoid: ["'Hardworking', 'quick learner', 'team player' - show these in your experience instead.", "Skill bars or ratings out of 10 - screening software cannot read them.", "Skills you could not talk about in an interview."],
    limits: "Up to 10 skills a group, 60 characters each.",
  },
  "projects.title": {
    title: "Project title",
    expected: ["A short, plain name that says what the project was."],
    examples: { general: same(["Inventory tracker for a family shop", "Customer feedback dashboard"]) },
    limits: "Up to 90 characters.",
  },
  "projects.detail": {
    title: "Your contribution",
    expected: ["What you built or did, for whom, and the result - one or two lines."],
    examples: { general: same(["Built a Google Sheets tracker for 200 products that flagged low stock, saving the owner a weekly manual count.", "Designed a survey and Excel dashboard summarising feedback from 150 students for the college placement cell."]) },
    avoid: ["Only the topic, with nothing about what you did."],
    limits: "Up to 240 characters.",
  },
  "projects.tools": {
    title: "Tools used",
    expected: ["The tools and software you used, named exactly."],
    examples: { general: same(["Google Sheets", "Excel", "Python", "Power BI"]) },
    limits: "Up to 6 tools, one per line, 40 characters each.",
  },
  "certifications.title": {
    title: "Certification title",
    expected: ["The certificate's exact name as the issuer writes it."],
    examples: { general: same(["Google Data Analytics Professional Certificate", "NISM Series V-A: Mutual Fund Distributors", "AWS Certified Cloud Practitioner"]) },
    avoid: ["Participation certificates that show no skill."],
    limits: "Up to 120 characters.",
  },
  "certifications.issuer": {
    title: "Issued by",
    expected: ["The organisation that awarded it."],
    examples: { general: same(["Coursera (Google)", "NISM", "Amazon Web Services"]) },
    limits: "Up to 90 characters.",
  },
  "certifications.year": {
    title: "Year",
    expected: ["The year you earned it."],
    examples: { general: same(["2024"]) },
    limits: "Up to 20 characters.",
  },
  achievements: {
    title: "Achievements",
    expected: ["Awards, ranks and recognitions, one per line, each with what it was for."],
    examples: { general: { student: ["University rank 3 in Cost Accounting, 2023", "Winner, inter-college business quiz, 2024"], early_career: ["Employee of the Month, March 2025, for highest CSAT in the team", "Top 5% of sales associates in the region, Q2 2024"] } },
    avoid: ["School-level achievements once you have college or work ones."],
    limits: "One per line.",
  },
  languages: {
    title: "Languages",
    expected: ["Each language with how well you use it, one per line."],
    examples: { general: same(["English (fluent)", "Hindi (native)", "Telugu (conversational)"]) },
    limits: "One per line.",
  },
  activities: {
    title: "Activities",
    expected: ["Clubs, volunteering and responsibilities, with what you did in them."],
    examples: { general: same(["Volunteer, National Service Scheme - organised a blood donation camp for 120 donors", "Treasurer, college commerce club - managed a ₹50,000 annual budget"]) },
    avoid: ["Activities with no role or result."],
    limits: "One per line.",
  },
  interests: {
    title: "Interests",
    expected: ["A few specific interests that say something about you. Optional."],
    examples: { general: same(["Long-distance running (2 half-marathons)", "Carnatic music"]) },
    avoid: ["Generic interests such as 'reading', 'music' or 'travelling'."],
    limits: "One per line.",
  },
} satisfies Record<string, FieldGuide>;

export type GuideKey = keyof typeof FIELD_GUIDES;

/** The examples to show: this role family's if there are any, else the general ones. */
export function examplesFor(key: GuideKey, track: GuideTrack, role?: string | null): { family: RoleFamily; lines: string[] } {
  const guide: FieldGuide = FIELD_GUIDES[key];
  const family = roleFamily(role);
  const set = guide.examples[family] ?? guide.examples.general;
  return { family: guide.examples[family] ? family : "general", lines: set[track] };
}
