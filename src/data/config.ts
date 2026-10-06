/* PLACEHOLDER CONTENT: replace with your own. */

export const config = {
  /** Where `exit` sends the visitor. Set VITE_MAIN_SITE_URL in .env (and on Vercel). */
  mainSiteUrl: (import.meta.env.VITE_MAIN_SITE_URL as string | undefined) || "https://example.com",
  /** File lives in /public. `run resume` downloads it under `filename`. */
  resume: { href: "/resume.pdf", filename: "resume.pdf" },
  /** Transparent SVG or PNG in /public. Used as-is in fastfetch. */
  logo: { src: "/logo.png", alt: "Rosh logo" },

  keyboard: {
    /** Files live in /public/audio/keys/<pack>/{press,release}/*.mp3 */
    basePath: "/audio/keys",
    /** alpaca, blackink, bluealps, boxnavy, cream, holypanda, mxblack, mxblue, mxbrown, redink, topre, turquoise */
    pack: "bluealps",
    /** How many GENERIC_R0..R(n-1).mp3 files each pack has. */
    genericVariants: 5,
    /** Also play the key-up sounds from release/. Off = keydown only. */
    playRelease: false,
    volume: 0.6,
  },

  lofi: {
    /** File lives in /public/audio/lofi/. */
    src: "/audio/lofi/honeyjam.mp3",
    title: "Honey Jam",
    artist: "Massobeats",
    /** Optional link to the artist or track page; shown by `play` as the source. */
    url: undefined as string | undefined,
    /** Much quieter than the key sounds. */
    volume: 0.35,
  },
};
