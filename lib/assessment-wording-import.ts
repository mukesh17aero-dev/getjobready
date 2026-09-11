import type { ArcBank } from "@/lib/api";

/** A local editorial import may change wording only, and must match its source. */
export function importAssessmentWording(bank: ArcBank, input: unknown): { bank: ArcBank; changed: number } {
  if (!input || typeof input !== "object" || !("updates" in input) || !Array.isArray(input.updates) || !input.updates.length) throw new Error("Choose a wording file with a non-empty updates list.");
  const changes = new Map<string, string>();
  for (const update of input.updates) {
    if (!update || typeof update !== "object" || typeof update.roleId !== "string" || typeof update.sceneId !== "string" || typeof update.before !== "string" || typeof update.brief !== "string" || !update.brief.trim() || update.brief.length > 30000) throw new Error("Each update needs a roleId, sceneId, original before text and revised brief.");
    const key = `${update.roleId}/${update.sceneId}`;
    if (changes.has(key)) throw new Error(`Duplicate question: ${key}. Nothing imported.`);
    const scene = bank.arcs.find(arc => arc.roleId === update.roleId)?.scenes.find(scene => scene.id === update.sceneId);
    if (!scene || scene.brief !== update.before) throw new Error(`Question ${key} has changed or is missing. Refresh the source file before importing. Nothing imported.`);
    changes.set(key, update.brief.trim());
  }
  let changed = 0;
  const arcs = bank.arcs.map(arc => ({ ...arc, scenes: arc.scenes.map(scene => {
    const brief = changes.get(`${arc.roleId}/${scene.id}`);
    if (!brief || brief === scene.brief) return scene;
    changed++;
    return { ...scene, brief };
  }) }));
  return { bank: { ...bank, arcs }, changed };
}
