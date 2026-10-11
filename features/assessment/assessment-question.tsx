import { assessmentQuestionCards } from "./assessment-presentation";
import { RichText } from "@/components/ui/rich-text";
import { assessmentTerms } from "./assessment-glossary";
import { ArrowRight, Eye, Grid, Handover, Mic, Pencil, Ranking } from "@/components/ui/icons";
// The styles come with the component. It renders a scene brief wherever a
// brief needs rendering - the sitting, and the job-fit skill check - and a
// caller should not have to know which stylesheet to import.
import "./assessment-workspace.css";

const QUESTION_KIND_LABELS: Record<string, { label: string; Icon: typeof Eye }> = {
  routing: { label: "Choose & explain", Icon: ArrowRight },
  prioritisation: { label: "Set the order", Icon: Ranking },
  handover: { label: "Leave a handover", Icon: Handover },
  categorize: { label: "Sort into groups", Icon: Grid },
  spot: { label: "Spot the difference", Icon: Eye },
  typed: { label: "Written response", Icon: Pencil },
  spoken: { label: "Spoken response", Icon: Mic },
  artefact: { label: "Produce the deliverable", Icon: Pencil },
};

export function AssessmentQuestion({ brief, responseText = "", kind, clues = false, part = "all" }: { brief: string; responseText?: string; kind?: string; clues?: boolean; part?: "all" | "context" | "prompt" }) {
  const { question, cards } = assessmentQuestionCards(brief);
  const terms = assessmentTerms(`${brief}\n${responseText}`);
  const badge = kind ? QUESTION_KIND_LABELS[kind] : undefined;
  return <div className="assessment-question">
    {part !== "context" && badge && <p className="assessment-question-kind"><badge.Icon size={14} />{badge.label}</p>}
    {part !== "context" && <RichText text={question} className="assessment-question-prompt" />}
    {part !== "prompt" && <>
    {terms.length > 0 && <details className="assessment-word-help"><summary>Words in this question <span>{terms.slice(0, 3).map(item => item.term).join(" · ")}{terms.length > 3 ? ` +${terms.length - 3}` : ""}</span></summary><dl>{terms.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl></details>}
    {clues
      ? <div className="assessment-clues">{cards.map((card, index) => <details key={index} className="assessment-clue">
          <summary><Eye size={16} /><span>{card.title}</span><small>Tap to read</small></summary>
          <RichText text={card.body} />
        </details>)}</div>
      : <div className="assessment-fact-cards">{cards.map((card, index) => <section key={index}>
          <h3>{card.title}</h3><RichText text={card.body} />
        </section>)}</div>}
    {part === "all" && <p className="assessment-think">{clues ? "Open each clue - everything you need is inside." : "Read the cards, think it through, then answer in your own words."}</p>}
    </>}
  </div>;
}
