// Which part of the rendered resume the editor is pointing at. The sheet
// marks the matching element with data-editing; the workbench styles it.

/**
 * The part of the resume being edited: a section, optionally one entry in it,
 * and the field being typed in ("header.name").
 */
export type SheetFocus = { section: string; entry?: number; field?: string };

/** Marks an entry, and says whether it is the one being edited. */
export const entryMark = (focus: SheetFocus | null | undefined, section: string, entry: number) => ({
  "data-resume-entry": entry,
  "data-editing": focus && focus.section === section && focus.entry === entry ? "" : undefined,
});

// The header is two things on the page: the name, and the contact details.
// Every template places them differently - the sidebar look puts the contact
// details in a box of their own under "Info" - so each is marked on its own.
export const nameMark = (focus: SheetFocus | null | undefined) =>
  focus?.section === "header" && (!focus.field || focus.field === "header.name") ? "" : undefined;
export const contactMark = (focus: SheetFocus | null | undefined) =>
  focus?.section === "header" && (!focus.field || focus.field !== "header.name") ? "" : undefined;
