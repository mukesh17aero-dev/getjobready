// Who the public pages are speaking to.
//
// Shared vocabulary rather than one feature's private type: the welcome pages
// switch on it, and the admin "view as" control needs to name the same three
// audiences without reaching into the welcome feature.
export type Audience = "student" | "college" | "employer";

export const AUDIENCES: readonly Audience[] = ["student", "college", "employer"] as const;

export const isAudience = (value: string | undefined): value is Audience =>
  value === "student" || value === "college" || value === "employer";
