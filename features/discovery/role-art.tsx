"use client";

import { useState } from "react";

// A role's own picture, drawn from the admin pictures page and stored by role
// id. A role without one keeps its object icon.

export const roleIllustrationUrl = (roleId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/role-illustrations/${roleId}.webp`;

export function RoleArt({ roleId, glyph }: { roleId: string; glyph: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden="true" className="discovery-role-object absolute left-1/2 top-9 -translate-x-1/2 text-[2.4rem] leading-none">
        {glyph}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="discovery-role-art absolute inset-x-0 top-0 h-[145px] overflow-hidden">
      {/* A plain img, loaded straight from storage: a redrawn picture shows
          within a minute. The ref catches a missing picture whose error fired
          before the page was interactive, which onError alone would miss. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={roleIllustrationUrl(roleId)}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-[center_40%]"
        ref={(img) => { if (img?.complete && img.naturalWidth === 0) setFailed(true); }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
