"use client";

import { useState } from "react";

// One person's picture, wherever it appears.
//
// Two things every avatar in this app needs and none of them had:
//
//   referrerPolicy="no-referrer". Google serves profile pictures from
//   googleusercontent.com and refuses them with a 403 when a Referer header
//   arrives from an origin it does not know - which is every localhost and
//   every preview deployment. Somebody who signed in with Google got a broken
//   image icon where their face should be.
//
//   A fallback that is not a broken image. Any remote picture can fail: the
//   bucket is wrong, the account has none, the network drops. A broken-image
//   glyph is the worst possible answer, because it looks like the product is
//   broken rather than like there is no photo. On failure this falls straight
//   back to the initial, which is what somebody without a photo sees anyway.

export function Avatar({
  src,
  name,
  className = "",
  fallbackClassName = "",
}: {
  src?: string | null;
  /** Used for the initial, and never rendered as the alt text - a photo of
      somebody beside their own name does not need their name read twice. */
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <span aria-hidden className={`${className} ${fallbackClassName}`}>
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}
