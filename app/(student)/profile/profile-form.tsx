"use client";

// The profile form itself.

import {
  importCareerDocument,
  uploadProfilePhoto,
  saveCareerProfile,
  type CareerProfile,
  type ImportResult,
  reflectCareerProfile,
} from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { jobFitReturn } from "@/lib/job-fit-return";
import { useRef, useState } from "react";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  NOTICE_PERIODS,
  TRACKS,
  WORK_PREFERENCES,
  FIELD_LABELS,
  completeness,
  emptyEducation,
  emptyExperience,
  hasSubstance,
  trackFromRecord,
  WORK_KINDS,
  readEducation,
  readExperience,
  workKindLabel,
  reflectionAnswers,
  type EducationEntry,
  type ExperienceEntry,
  toFields,
  type ProfileFields,
  type Track,
  BUSINESS_SPACES, PassportLinkButton,
} from "@/features/profile";
import styles from "./profile-form.module.css";
import { track as trackEvent } from "@/lib/footprints";
import { profileSavePayload } from "@/features/profile";
import { RememberHub } from "@/features/journey";
import { BackLink } from "@/components/ui/back-link";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { PhotoPicker } from "@/features/profile";
import { Text, Part, ProfileDialog, looksWritten, percentValid } from "./profile-fields";
import { Choice, FINISH_SHAPE, HistoryList, MultiChoice, TextArea } from "./profile-inputs";
export function ProfileForm({
  profile,
  suggestedName,
  photo = null,
}: {
  profile: CareerProfile | null;
  suggestedName: string;
  /** Uploaded on the professional profile; shown here too. */
  photo?: string | null;
}) {
  const router = useRouter();
  const [gate, setGate] = useState<GatedAction | null>(null);
  const params = useSearchParams();
  const isWelcome = params.get("welcome") === "1";
  const sections = ["Basics", "Education", "Experience", "Interests"] as const;
  const [section, setSection] = useState<(typeof sections)[number]>("Basics");
  const savedProfile = useRef(profile);
  const saving = useRef(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);
  const photoUploading = useRef(false);
  const [importOpen, setImportOpen] = useState(false);

  async function savePhoto(blob: Blob) {
    if (photoUploading.current) return;
    photoUploading.current = true;
    setPhotoBusy(true); setPhotoError(null); setPhotoSaved(false);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session) { setGate({ what: "your photo", why: "A photo has to live somewhere, and that somewhere is an account." }); return; }
      const result = await uploadProfilePhoto(data.session.access_token, blob);
      if (!result || "error" in result) { setPhotoError(result && "error" in result ? result.error : "Your photo didn’t save. Please try again."); return; }
      setCurrentPhoto(result.photo); setPhotoSaved(true); setPhotoOpen(false);
      await supabaseBrowser().auth.refreshSession();
      router.refresh();
    } catch { setPhotoError("Your photo couldn’t be updated. Please try again."); }
    finally { photoUploading.current = false; setPhotoBusy(false); }
  }

  const professionalPart = () => (
    <Part
      key="professional"
      title="Experience"
      blurb="A few useful examples are enough. Add more when you need to."
    >
      <Text
        label="Your skills"
        hint="Comma separated - including from college or part-time work."
        value={fields.skills}
        onChange={set("skills")}
        placeholder="Customer service, MS Excel, Tally, Tamil"
      />
      <HistoryList
        title="Where you have worked"
        hint="Jobs, internships or projects you want to include."
        addLabel="Add work history"
        entries={experience}
        blank={emptyExperience}
        onChange={(entries) => { setExperience(entries); setSaved(false); setSummary(null); }}
        caption={(entry) =>
          entry.title.trim()
            ? `${workKindLabel(entry.kind)} - ${entry.title.trim()}`
            : workKindLabel(entry.kind)
        }
        fields={[
          { key: "kind", label: "What kind of work", options: WORK_KINDS },
          {
            key: "title",
            label: "What you did there",
            placeholder: "Store assistant",
          },
          {
            key: "organisation",
            label: "Company or organisation",
            placeholder: "Sharma General Stores",
          },
          {
            key: "from",
            label: "Started",
            placeholder: "2023",
            inputMode: "numeric" as const,
          },
          {
            key: "to",
            label: "Finished",
            placeholder: "2024",
            inputMode: "numeric" as const,
            hideWhen: (entry) => Boolean(entry.current),
          },
          { key: "current", label: "", tick: "I am still working here" },
          {
            key: "detail",
            label: "What the work involved",
            placeholder:
              "Billing at the counter, stock lists, handling customer questions",
            wide: true,
          },
        ]}
      />
      {experience.some(hasSubstance) && (
        <>
          <Choice
            label="When you could start"
            placeholder="Choose your notice period"
            hint="Decides which openings are realistic today."
            value={fields.noticePeriod}
            options={NOTICE_PERIODS}
            onChange={set("noticePeriod")}
          />
          <Text
            label="What you are looking for (optional)"
            hint="One line - pay, growth, hours, the work itself."
            value={fields.reasonForChange}
            onChange={setChecked("reasonForChange")}
            error={errors.reasonForChange}
            placeholder="Want a role with clearer growth than shift work"
          />
        </>
      )}
    </Part>
  );

  const educationalPart = () => (
    <Part
      key="educational"
      title="Education"
      blurb="Every stage you have finished or are in now, and how you learn."
    >
      <HistoryList
        title="Where you studied"
        hint="Your saved qualifications. Open a record to edit it."
        addLabel="Add education"
        entries={education}
        blank={emptyEducation}
        onChange={(entries) => { setEducation(entries); setSaved(false); setSummary(null); }}
        caption={(entry) => entry.qualification.trim() || "New entry"}
        fields={[
          {
            key: "qualification",
            label: "Qualification",
            placeholder: "Class XII",
          },
          {
            key: "institution",
            label: "School or college",
            placeholder: "Kendriya Vidyalaya, Coimbatore",
          },
          {
            key: "from",
            label: "Started",
            placeholder: "2019",
            inputMode: "numeric" as const,
          },
          {
            key: "to",
            label: "Finished",
            placeholder: "2021",
            inputMode: "numeric" as const,
            hideWhen: (entry) => Boolean(entry.current),
          },
          { key: "current", label: "", tick: "I am still studying here" },
          {
            key: "stream",
            label: "Stream (optional)",
            placeholder: "Commerce",
          },
          {
            key: "marks",
            label: "Marks % (optional)",
            placeholder: "78",
            inputMode: "numeric" as const,
            check: (value: string) =>
              !value.trim() || percentValid(value)
                ? undefined
                : "A percentage between 1 and 100.",
          },
        ]}
      />
      {/* Only for someone still studying. Anyone who has finished has already
          said when, on the card for that qualification - asking again would
          be asking a question their own answer has closed. */}
      {education.some((entry) => Boolean(entry.current)) && (
        <Text
          label="When you expect to finish"
          hint="The month you expect to be done. Employers plan intake around this."
          value={fields.expectedFinish}
          onChange={(v) => {
            setFinishError(null);
            set("expectedFinish")(v);
          }}
          error={finishError ?? undefined}
          placeholder="May 2027"
        />
      )}
      <details className={styles.extras}><summary>Subjects you enjoy <span>Optional</span></summary><div className={styles.fields}>
      <Text
        label="Favourite subjects in school (optional)"
        value={fields.favSubjectsSchool}
        onChange={setChecked("favSubjectsSchool")}
        error={errors.favSubjectsSchool}
        placeholder="Maths, Geography"
      />
      <Text
        label="Favourite subjects in college (optional)"
        value={fields.favSubjectsCollege}
        onChange={setChecked("favSubjectsCollege")}
        error={errors.favSubjectsCollege}
        placeholder="Statistics, Marketing"
      />
      </div></details>
    </Part>
  );

  const rawInitial = toFields(profile);
  const initial = { ...rawInitial, track: profile ? trackFromRecord({
    studyingNow: readEducation(profile.education).filter(hasSubstance).some(entry => Boolean(entry.current)),
    hasWork: readExperience(profile.experience).some(hasSubstance),
    chosen: rawInitial.track,
  }) : rawInitial.track };
  const [fields, setFields] = useState<ProfileFields>({
    ...initial,
    fullName: initial.fullName || suggestedName,
  });
  // Schooling and jobs are lists: a tenth, a twelfth and a degree; one job or
  // three. They live in the record's own arrays, which the resume reads.
  const [education, setEducation] = useState<EducationEntry[]>(
    readEducation(profile?.education),
  );
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    readExperience(profile?.experience),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const set = (key: keyof ProfileFields) => (value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setSummary(null);
    setSaved(false);
  };

  function chooseTrack(id: Track) {
    setFields((f) => ({ ...f, track: id }));
    setSummary(null);
    setTrackError(null);
    setTrackNote(null);
    setSaved(false);
    trackEvent({
      family: "decision",
      event: "profile_track_chosen",
      module: "career_record",
      target: id,
    });
  }

  // Reading a CV or LinkedIn export fills the form in; it never saves. The
  // student sees what we read and can change any of it before saving.
  async function importFrom(file: File, source: "resume" | "linkedin") {
    setImporting(true);
    setImportError(null);
    setImported(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setImporting(false);
      setGate({
        what: "your profile from that file",
        why: "Reading a resume or a LinkedIn export means an AI pulls out your history and writes it into a record - and that record is yours, so it needs an account to sit in.",
      });
      return;
    }
    const result = await importCareerDocument(token, file, source);
    setImporting(false);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    const found = result.data;
    setImported(found);
    setSummary(null);

    // Every job and every qualification the document lists, as cards they can
    // check and correct. Only added when the list is still empty - an import
    // must never quietly overwrite what someone has already typed.
    const importedWork = (found.experience ?? []).map((row) => ({
      kind: row.kind || "job",
      title: row.title,
      organisation: row.organisation,
      from: row.from,
      to: row.to,
      current: row.current ? "yes" : "",
      detail: row.detail,
    }));
    const importedStudy = (found.education ?? []).map((row) => ({
      qualification: row.qualification,
      institution: row.institution,
      from: row.from,
      to: row.to,
      current: row.current ? "yes" : "",
      marks: row.marks,
      stream: row.stream,
    }));
    if (importedWork.length && !experience.some(hasSubstance))
      setExperience(importedWork);
    if (importedStudy.length && !education.some(hasSubstance))
      setEducation(importedStudy);

    setFields((f) => {
      const next = { ...f };
      const take = (field: string) =>
        found.suggestions.find((s) => s.field === field)?.value ?? "";
      // Only fill what is still empty. Never overwrite something typed.
      const fill = (
        key: Exclude<keyof ProfileFields, "track">,
        value: string,
      ) => {
        if (value && !String(next[key] ?? "").trim()) next[key] = value;
      };
      fill("fullName", take("fullName"));
      fill("city", take("city"));
      fill("phone", take("phone"));
      fill("currentRole", take("currentRole"));
      fill("institution", take("institution"));
      fill("course", take("course"));
      if (found.languages?.length)
        fill("languages", found.languages.join(", "));
      if (found.skills.length) fill("skills", found.skills.join(", "));
      if (found.activities.length)
        fill("activities", found.activities.join("\n"));
      // The document decides, so nobody has to answer a question it already
      // answers: still at college with no finished job reads as studying;
      // anything else reads as someone already in work.
      if (!next.track) {
        const stillStudying = importedStudy.some(
          (row) => row.current === "yes",
        );
        const hasWorked =
          importedWork.length > 0 || Boolean(take("currentRole"));
        next.track = hasWorked && !stillStudying ? "early_career" : "student";
      }
      return next;
    });
    setSaved(false);
    trackEvent({
      family: "engagement",
      event: "profile_imported",
      module: "career_record",
      target: source,
      meta: { fields: found.suggestions.length, skills: found.skills.length },
    });
  }

  const percent = completeness(fields);

  const [finishError, setFinishError] = useState<string | null>(null);
  // Said against the choice itself, where the two cards are.
  const [trackError, setTrackError] = useState<string | null>(null);
  // What the page worked out about them, said once, where the cards are.
  const [trackNote, setTrackNote] = useState<string | null>(null);
  // Said next to the button that did nothing, because an error attached to a
  // box far up the page - or to one that is not on screen at all - is an
  // error nobody sees.
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFields, string>>
  >({});
  // The story survives visits: it is stored with the profile's preferences
  // and greets the person whenever they come back.
  const storedStory = profile?.preferences?.["storySummary"];
  const [summary, setSummary] = useState<string | null>(
    typeof storedStory === "string" && storedStory.trim() ? storedStory : null,
  );
  // What the model last saw (starting from what was already stored) - the
  // reflection is only requested when a save actually changes something.
  const lastReflected = useRef(JSON.stringify(reflectionAnswers(initial)));
  // True when the story on screen describes who they were before this save.
  const [storyStale, setStoryStale] = useState(false);

  // The open text boxes, and what a bad answer should hear.
  // Only what this form actually asks. Institution, course, current role,
  // employer and internship experience were retired into the two history
  // lists, but their old values still sit in the record - and checking a
  // value nobody can see means a save that refuses with no box to fix.
  const WRITTEN: Array<{ key: keyof ProfileFields; message: string }> = [
    { key: "fullName", message: "That doesn't read like a name - check it?" },
    { key: "city", message: "That doesn't read like a place - check it?" },
    {
      key: "aspirations",
      message:
        "A few honest lines help here - this doesn't read like them yet.",
    },
    {
      key: "favSubjectsSchool",
      message: "That doesn't read like subjects - check it?",
    },
    {
      key: "favSubjectsCollege",
      message: "That doesn't read like subjects - check it?",
    },
    // Asked only of someone who has added work, so checked only then.
    ...(experience.some(hasSubstance)
      ? [
          {
            key: "reasonForChange" as const,
            message: "A few real words help here - check it?",
          },
        ]
      : []),
  ];

  const setChecked = (key: keyof ProfileFields) => (value: string) => {
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    setSummary(null);
    set(key)(value);
  };

  async function save() {
    if (saving.current) return;
    // Every open text box must read like language before anything saves.
    const found: Partial<Record<keyof ProfileFields, string>> = {};
    for (const { key, message } of WRITTEN) {
      const value = String(fields[key] ?? "").trim();
      if (value && !looksWritten(value)) found[key] = message;
    }
    // Marks are checked on the education card they were typed into, not
    // here: these three values are worked out from those cards, so a stale
    // one from an older visit must not block a save nobody can unblock.
    // The one free-text field with a shape: a month and a year. Empty is
    // allowed (not everyone knows yet); nonsense is not. Only checked when
    // the box is on screen - a stale value behind a hidden field must never
    // block a save.
    const stillStudying = education.some((entry) => Boolean(entry.current));
    let finishProblem: string | null = null;
    if (stillStudying && fields.expectedFinish.trim() !== "") {
      const match = FINISH_SHAPE.exec(fields.expectedFinish);
      const year = match ? Number(match[2]) : 0;
      const now = new Date().getFullYear();
      if (!match) {
        finishProblem = "Give a month and a year - like May 2027.";
      } else if (year < now - 1 || year > now + 8) {
        finishProblem = `That year looks off - expected between ${now - 1} and ${now + 8}.`;
      }
    }
    // Where they are is settled by what is on the page, not by which card
    // was tapped first. A course in progress means studying, whatever else
    // is going on; no course and a real job means working. Both are read
    // from the entries themselves, so a record cannot save a contradiction
    // of itself - and a student who takes a job stops being filed as a
    // student the moment they add it.
    const studyingNow = education
      .filter(hasSubstance)
      .some((entry) => Boolean(entry.current));
    const hasWork = experience.some(hasSubstance);
    const settled = trackFromRecord({
      studyingNow,
      hasWork,
      chosen: fields.track,
    });

    if (settled !== fields.track) {
      // Say what changed and why, in one line, rather than moving it
      // silently under them.
      setFields((f) => ({ ...f, track: settled }));
      // The stored story describes a student or a working person, and it has
      // just stopped being true. It is marked stale rather than wiped: the
      // rewrite takes a second or two, and clearing it outright leaves the
      // person staring at the space where their story used to be.
      setStoryStale(true);
      lastReflected.current = "";
      setTrackNote(
        settled === "student"
          ? studyingNow
            ? "Marked as studying - you have an active course in progress."
            : "Marked as studying - no work experience is listed yet. Add a job or internship and this updates."
          : "Marked as working or job-hunting - you are working currently and have no active course in progress.",
      );
    } else {
      setTrackNote(null);
    }
    setTrackError(null);
    const settledFields = { ...fields, track: settled };

    setFinishError(finishProblem);
    setErrors(found);

    if (Object.keys(found).length > 0 || finishProblem) {
      const named = [
        ...Object.keys(found).map(
          (key) => FIELD_LABELS[key as keyof ProfileFields] ?? key,
        ),
        ...(finishProblem ? ["when you expect to finish"] : []),
      ];
      setFormError(
        named.length === 1
          ? `Not saved yet - have another look at ${named[0]}.`
          : `Not saved yet - ${named.length} answers need a look: ${named.join(", ")}.`,
      );
      if (found.fullName || found.city) setSection("Basics");
      else if (finishProblem || found.favSubjectsSchool || found.favSubjectsCollege) setSection("Education");
      else if (found.reasonForChange) setSection("Experience");
      else if (found.aspirations) setSection("Interests");
      // Take them to the first one rather than leaving them hunting.
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFormError(null);
    saving.current = true;
    setBusy(true);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      saving.current = false;
      setBusy(false);
      setGate({
        what: "your story so far",
        why: "Saving writes your record and has us write your story back to you - both of which have to belong to somebody to be here next time.",
      });
      return;
    }
    const result = await saveCareerProfile(token, profileSavePayload(
      savedProfile.current, settledFields, education, experience, summary,
    ));
    saving.current = false;
    setBusy(false);
    if (result) { savedProfile.current = result; setImported(null); router.refresh(); }
    setSaved(Boolean(result));
    // A failed save has to say so: "Saved" quietly not appearing is how
    // people lose an afternoon's typing.
    setFormError(
      result ? null : "That didn't save. Check your connection and try again.",
    );
    // Built from the settled answer: a story written about a student, for
    // somebody we have just marked as working, is worse than no story.
    const snapshot = JSON.stringify(reflectionAnswers(settledFields));
    if (!result) setStoryStale(false);
    if (result && !isWelcome && snapshot !== lastReflected.current) {
      lastReflected.current = snapshot;
      // Advisory, after the fact: the model double-checks the answers and
      // reflects the story back. Slow or absent, the save stands either way.
      void Promise.race([
        reflectCareerProfile(token, reflectionAnswers(settledFields)),
        new Promise<null>((r) => setTimeout(() => r(null), 8000)),
      ]).then((reflection) => {
        if (savedProfile.current !== result) return;
        if (!reflection) {
          // No new story came back. A story that has been contradicted must
          // not stay on the screen as though it were still true.
          if (storyStale) {
            setSummary(null);
            setStoryStale(false);
          }
          return;
        }
        if (reflection.issues.length > 0) {
          setErrors((e) => {
            const next = { ...e };
            for (const issue of reflection.issues) {
              next[issue.field as keyof ProfileFields] = issue.message;
            }
            return next;
          });
        }
        if (reflection.summary) {
          setSummary(reflection.summary);
          setStoryStale(false);

        }
      });
    }
    trackEvent({
      family: "decision",
      event: "profile_saved",
      module: "career_record",
      target: settled,
      meta: { completeness: percent },
    });
    if (result && jobFitReturn(params.get("returnTo"))) router.push(jobFitReturn(params.get("returnTo"))!);
    else if (result && isWelcome) router.push("/start");
  }

  return (
    <main className={styles.page}>
      <div className="pt-4">
        {/* Not a FeatureLanding, so it records itself: the Professional
            Profile Builder is reached from here as well as from Resume. */}
        {!isWelcome && <RememberHub path="/profile" />}
        <BackLink fallbackHref="/" fallbackLabel="Back to Home" />
      </div>

      <header className={styles.header}>
        <button type="button" className={styles.photoButton} onClick={() => { setPhotoError(null); setPhotoOpen(true); }} aria-label={currentPhoto ? "Change profile photo" : "Upload profile photo"}>
          <Avatar src={currentPhoto} name={fields.fullName || "You"} className="h-12 w-12 shrink-0 rounded-full ring-1 ring-slate-200" fallbackClassName="grid place-items-center bg-brand-mist text-lg font-bold text-brand-teal-deep" />
          <span>{photoBusy ? "Uploading…" : currentPhoto ? "Change photo" : "Add photo"}</span>
        </button>
        <div className={styles.heading}><h1>{isWelcome ? "Tell us enough to guide you" : "Your profile"}</h1><p>A few useful details. Build the rest as you go.</p>{photoSaved && <small role="status">Profile photo updated.</small>}{photoError && !photoOpen && <small role="alert">{photoError}</small>}</div>
      </header>
      <div className={styles.workspace}>
      <div className={styles.editor}>
        <nav aria-label="Profile sections" className={styles.tabs}>
          {sections.map(item => <button type="button" key={item} aria-pressed={section === item} aria-controls="profile-section" onClick={() => setSection(item)} className={`min-h-11 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet ${section === item ? "bg-brand-violet text-white" : "text-slate-600 hover:bg-slate-100"}`}>{item}</button>)}
        </nav>
        <div id="profile-section" aria-label={section}>
      {(
        <>
          {/* Four parts, each a heading a person would recognise: who you
              are, what you have done for work, what you have studied, and
              where you want to go. The middle two swap places by track -
              someone working should not scroll past three questions about
              college to reach the boxes that are about them. */}
          {section === "Basics" && <Part
            title="Basics"
            blurb="The basics your resume and Passport carry."
          >
            <Text
              label="Your name"
              hint="Used on your resume and Passport."
              value={fields.fullName}
              onChange={setChecked("fullName")}
              error={errors.fullName}
              placeholder="Priya Sharma"
            />
            <Text
              label="Where you are"
              hint="City and state."
              value={fields.city}
              onChange={setChecked("city")}
              error={errors.city}
              placeholder="Coimbatore, Tamil Nadu"
            />
            {/* On the resume header, and nowhere else until now. The importer
                could already find a phone in an uploaded CV and had no field
                to write it to. */}
            <Text
              label="Phone number"
              hint="Optional until you need it on your resume."
              value={fields.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
            />
            <Text
              label="LinkedIn or portfolio"
              hint="Optional. One link."
              value={fields.link}
              onChange={set("link")}
              placeholder="linkedin.com/in/priyasharma"
            />
            <PassportLinkButton onFound={set("link")} />
            <label className="block"><span className="text-[0.8rem] font-semibold text-slate-800">Where are you now?</span><span className="block text-[0.72rem] text-slate-500">Choose what describes you today.</span>
              <select className={styles.select} value={fields.track} onChange={event => chooseTrack(event.target.value as Track)} aria-invalid={trackError ? true : undefined}>
                <option value="">Choose your situation</option>{TRACKS.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>{(trackError || trackNote) && <small className="text-xs text-slate-600">{trackError ?? trackNote}</small>}
            </label>
            <Text
              label="Languages you work in"
              hint="Comma separated."
              value={fields.languages}
              onChange={set("languages")}
              placeholder="English, Tamil, Hindi"
            />
            <details className={styles.extras}><summary>Activities, volunteering or other interests <span>Optional</span></summary><label className="block">
              <span className="text-[0.8rem] font-semibold text-slate-800">
                Anything else you do (optional)
              </span>
              <span className="block text-[0.72rem] text-slate-400">
                One per line - volunteering, a club, a sport, a certificate, a
                side project. Employers read these as evidence too.
              </span>
              <textarea
                rows={3}
                value={fields.activities}
                onChange={(e) => set("activities")(e.target.value)}
                placeholder={
                  "Volunteer coordinator, NSS unit\nWeekend tutoring for two neighbours"
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </label></details>
          </Part>}
          {section === "Education" && educationalPart()}
          {section === "Experience" && professionalPart()}
          {section === "Interests" && <Part
            title="Interests"
            blurb="Where you want this to go. This is what your plan is built around."
          >
            <Choice
              label="Work preference"
              placeholder="Choose on-site, hybrid or either"
              value={fields.workPreference}
              options={WORK_PREFERENCES}
              onChange={set("workPreference")}
            />
            <TextArea
              label="Your aspirations"
              hint="A few honest lines: where do you want your career to go, and what would success look like to you?"
              value={fields.aspirations}
              onChange={setChecked("aspirations")}
              error={errors.aspirations}
              placeholder="In three years I want to be leading a small support team - steady work, real growth, and enough to help at home."
            />
            <MultiChoice
              label="Business spaces that interest you"
              hint="Tell us where your interest lies - pick as many as feel like you."
              value={fields.interestedSpaces}
              options={BUSINESS_SPACES}
              onChange={set("interestedSpaces")}
            />
          </Part>}
        </>
      )}

      </div>
      <div className={styles.saveBar}>
        <p
          className={`flex-1 text-xs ${
            formError ? "font-semibold text-rose-600" : "text-slate-500"
          }`}
          role={formError ? "alert" : "status"}
        >
          {/* A button that refuses without saying why is the same as a broken
              one. Save is gated on the track question and nothing on screen
              said so - the line beside it read "You can change any of this
              later", which is true and useless. missingEssentials already
              knew the answer; it just was not being asked. */}
          {formError ??
            (saved
              ? "Saved to your career record."
              : !fields.track
                ? "Choose your current situation in Basics to save."
                : imported ? "Review the imported facts in each section, then save the details you want to keep."
                  : null)}
        </p>
        <button
          type="button"
          disabled={busy || !fields.track}
          onClick={() => void save()}
          className="rounded-lg bg-brand-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50"
        >
          {busy ? "Saving…" : isWelcome ? "Save and continue" : "Save changes"}
        </button>
      </div>
      </div>
      <aside className={styles.side} aria-label="Ways to move faster">
        <section className={styles.sideCard}>
          <h2>You can explore now</h2>
          <p>A phone number or a favourite subject is not a reason to wait. Look at real roles and come back to fill in the rest.</p>
          <Link href="/discover" className={styles.sideLink}>Explore roles ↗</Link>
        </section>
        <section className={styles.sideCard}>
          <h2>Already have a resume?</h2>
          <p>Import it, then review what was read before keeping it.</p>
          <button type="button" className={styles.secondary} onClick={() => setImportOpen(true)}>Import a resume</button>
        </section>
      </aside>
      </div>
      {importOpen && <ProfileDialog title="Import profile details" onClose={() => setImportOpen(false)}>
      {/* Fastest path: read an existing CV or LinkedIn export. */}
      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h2 className="text-[0.9rem] font-semibold text-slate-900">
          Already have a CV or a LinkedIn profile?
        </h2>
        {/* What it takes, said outright. Only the LinkedIn button named a
            format, so a resume PDF looked unsupported - people were exporting
            to Word, or giving up, for a file the reader has always handled. */}
        <p className="mt-0.5 text-[0.8rem] text-slate-500">
          PDF or Word, up to 15MB. Your document is read to fill this form in.
          Nothing is saved until you press save.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="focus-within:ring-2 focus-within:ring-brand-violet focus-within:ring-offset-2 inline-flex min-h-11 items-center cursor-pointer rounded-lg bg-surface border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-brand-violet">
            {importing ? "Reading…" : "Upload your CV or resume"}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="sr-only"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFrom(file, "resume");
                e.target.value = "";
              }}
            />
          </label>
          <label className="focus-within:ring-2 focus-within:ring-brand-violet focus-within:ring-offset-2 inline-flex min-h-11 items-center cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
            Upload a LinkedIn export
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="sr-only"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFrom(file, "linkedin");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {importError && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2 text-[0.82rem] text-rose-700">
            {importError}
          </p>
        )}
        {imported && (
          <div className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-[0.82rem] text-teal-700">
            <p className="font-semibold">
              Read {imported.suggestions.length} details
              {imported.skills.length > 0 &&
                `, ${imported.skills.length} skills`}
              {imported.activities.length > 0 &&
                `, ${imported.activities.length} activities`}{" "}
              from your{" "}
              {imported.source === "linkedin" ? "LinkedIn export" : "CV"}.
            </p>
            <ul className="mt-1.5 grid gap-0.5 text-[0.76rem] text-teal-700">
              {imported.suggestions.map((suggestion) => (
                <li key={suggestion.field}>
                  <strong className="font-semibold">{suggestion.field}:</strong>{" "}
                  {suggestion.value}
                </li>
              ))}
            </ul>
            {(imported.experience?.length || imported.education?.length) && (
              <p className="mt-1.5 text-[0.76rem] text-teal-700">
                Added{" "}
                {[
                  imported.experience?.length
                    ? `${imported.experience.length} work ${imported.experience.length === 1 ? "entry" : "entries"}`
                    : "",
                  imported.education?.length
                    ? `${imported.education.length} education ${imported.education.length === 1 ? "entry" : "entries"}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                in Education and Experience — check each one and correct anything we misread.
              </p>
            )}
            <p className="mt-1.5 text-[0.72rem] text-teal-700">
              We only filled boxes that were empty.
            </p>
          </div>
        )}
      </section>
        <div className={styles.editorFooter}><button type="button" className={styles.secondary} onClick={() => setImportOpen(false)}>Review in my profile</button></div>
      </ProfileDialog>}
      {photoOpen && <ProfileDialog title={currentPhoto ? "Update your profile photo" : "Add your profile photo"} onClose={() => setPhotoOpen(false)}>
        <p className={styles.dialogNote}>Choose a new photo or take one now. Your photo is saved separately from the form.</p>
        <PhotoPicker photo={currentPhoto} name={fields.fullName || "You"} busy={photoBusy} uploadError={photoError} onPick={blob => void savePhoto(blob)} onCancel={() => setPhotoOpen(false)} />
      </ProfileDialog>}
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    </main>
  );
}
