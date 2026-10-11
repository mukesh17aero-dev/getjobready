"use client";

import { useState, useSyncExternalStore } from "react";
import { sharePassport, revokePassportShare, type PassportSharing } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// The one interactive piece of an otherwise read-only page. A share is a
// capability link: whoever holds it can open the passport, so create and
// revoke are the only two actions here, and both ask first. Revoke, because
// an employer who already has the link keeps reading a page that has quietly
// become dead. Create, because it publishes a copy of this record to anyone
// the link reaches - a product review found a live link made by one click,
// with no statement of what it exposed or for how long.

const neverChanges = () => () => {};

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * What creating a link actually does, said before it is done. Exported for
 * the test that pins every clause a person is consenting to.
 */
export function shareConsequence(lifetimeDays: number): string {
  const span = lifetimeDays === 1 ? "1 day" : `${lifetimeDays} days`;
  return `Anyone with the link will see a copy of this page as it is right now: the skills, evidence and achievements shown here, without the ones you have hidden. Changes you make afterwards will not appear on it. The link stays open for ${span}, or until you revoke it.`;
}

export function PassportShare({ sharing }: { sharing: PassportSharing }) {
  const [active, setActive] = useState(sharing.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [confirmingShare, setConfirmingShare] = useState(false);
  // window is not available while this renders on the server; the empty
  // server snapshot fills in with the real origin once mounted, same
  // pattern back-link.tsx uses for the remembered hub.
  const origin = useSyncExternalStore(neverChanges, () => window.location.origin, () => "");

  const share = async () => {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const result = await sharePassport(t);
    setBusy(false);
    setConfirmingShare(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setActive({ token: result.token, expiresAt: result.expiresAt });
  };

  const revoke = async () => {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const ok = await revokePassportShare(t);
    setBusy(false);
    setConfirmingRevoke(false);
    if (!ok) {
      setError("Could not revoke the link. Try again.");
      return;
    }
    setActive(null);
  };

  const url = active && origin ? `${origin}/passport/${active.token}` : "";

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-brand-mist p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[0.85rem] font-semibold text-brand-ink">Candidate controlled. Shared when ready.</h3>
          <p className="mt-0.5 max-w-md text-[0.78rem] text-slate-600">{sharing.reason}</p>
        </div>
        {!active && (
          <button
            type="button"
            disabled={!sharing.enabled || busy}
            onClick={() => setConfirmingShare(true)}
            className="min-h-10 cursor-pointer rounded-xl bg-brand-teal-deep px-4 py-2 text-[0.8rem] font-semibold text-white transition-colors hover:bg-brand-teal disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "One moment…" : "Share this passport"}
          </button>
        )}
      </div>

      {active && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-3">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">Live link</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-[0.78rem] text-brand-ink">{url}</code>
            <CopyButton value={url} label="passport link" />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.75rem] text-slate-500">Expires {formatDate(active.expiresAt)}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingRevoke(true)}
              className="min-h-8 cursor-pointer rounded-lg border border-rose-200 px-3 text-[0.75rem] font-semibold text-rose-800 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              Revoke link
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[0.75rem] text-rose-800">{error}</p>}

      {confirmingShare && (
        <ConfirmDialog
          title="Share your passport?"
          body={shareConsequence(sharing.lifetimeDays)}
          confirmLabel="Create the link"
          cancelLabel="Not yet"
          busy={busy}
          onConfirm={() => void share()}
          onClose={() => setConfirmingShare(false)}
        />
      )}

      {confirmingRevoke && (
        <ConfirmDialog
          title="Revoke this link?"
          body="Anyone who still has this link — including an employer already looking at it — will immediately lose access. This cannot be undone; you would need to share a new link."
          confirmLabel="Revoke it"
          busy={busy}
          onConfirm={() => void revoke()}
          onClose={() => setConfirmingRevoke(false)}
        />
      )}
    </div>
  );
}
