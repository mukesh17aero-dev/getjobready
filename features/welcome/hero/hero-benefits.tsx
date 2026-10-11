import { Check } from "@/components/ui/icons";
import type { AudienceConfig } from "./config";
import s from "./welcome-hero.module.css";

// Three reasons under the headline, each a claim the product can back.

export function HeroBenefits({ config }: { config: AudienceConfig }) {
  return (
    <ul className={s.benefits} aria-label="What you get">
      {config.benefits.map((benefit) => (
        <li key={benefit.title}>
          <span className={s.benefitMark} aria-hidden="true">
            <Check size={13} />
          </span>
          <span>
            <strong>{benefit.title}</strong>
            <small>{benefit.detail}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
