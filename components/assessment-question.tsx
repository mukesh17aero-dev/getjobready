import { assessmentQuestionCards } from "@/lib/assessment-presentation";
import { RichText } from "@/components/rich-text";
import { assessmentTerms } from "@/lib/assessment-glossary";

export function AssessmentQuestion({ brief, responseText = "" }: { brief: string; responseText?: string }) {
  const { question, cards } = assessmentQuestionCards(brief);
  const terms = assessmentTerms(`${brief}\n${responseText}`);
  return <div className="assessment-question">
    <RichText text={question} className="assessment-question-prompt" />
    {terms.length > 0 && <details className="assessment-word-help"><summary>Words in this question <span>{terms.slice(0, 3).map(item => item.term).join(" · ")}{terms.length > 3 ? ` +${terms.length - 3}` : ""}</span></summary><dl>{terms.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl></details>}
    <div className="assessment-fact-cards">{cards.map((card, index) => <section key={index}>
      <h3>{card.title}</h3><RichText text={card.body} />
    </section>)}</div>
    <p className="assessment-think">Read the cards, think it through, then answer in your own words.</p>
  </div>;
}
