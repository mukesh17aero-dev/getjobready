import { Roboto } from "next/font/google";
import s from "./m3.module.css";

// The resume builder's Material 3 root: the scoped palette and Roboto.
// Put on the outermost element of each builder page; everything inside picks
// up the Material roles through the app's own tokens (see m3.module.css).

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const M3_ROOT = `${s.m3} ${roboto.variable}`;
