// next/font only works inside Next's own compiler; under Vitest every font
// loader is a plain function returning the same shape with empty names.
// Wired in vitest.config.ts. The app itself always loads the real fonts.
type FontResult = { className: string; variable: string; style: { fontFamily: string } };
const font = (): FontResult => ({ className: "", variable: "", style: { fontFamily: "" } });
export const Roboto = font;
export const Geist = font;
export const Geist_Mono = font;
export const Space_Grotesk = font;
