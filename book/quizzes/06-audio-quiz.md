# Quiz 06 — Audio Subsystem

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] Why does the browser require a user gesture before audio can play?

A) To save battery on mobile devices  
B) To prevent autoplaying audio (spam/ads)  
C) Because the Web Audio API is synchronous  
D) To ensure the user has speakers connected  

---

**Q2** [Trace] How is the lofi `<audio>` element tricked into being allowed to play later?

A) It's added to the DOM with `autoplay` attribute  
B) It's "primed" by playing a short, silent base64 track during the first user gesture  
C) It uses a Web Worker to bypass the main thread  
D) It relies on an iframe  

---

**Q3** [Apply] A visitor presses a key on an Android virtual keyboard. How does `keySound.ts` know what sound to play?

A) It uses `event.keyCode` which maps perfectly  
B) It can't, virtual keyboards are completely silent  
C) `useKeySound` compares the previous and next input value to infer backspace, space, or generic  
D) It plays a default "tap" sound for everything  

---

**Q4** [Design] Why are Web Audio API `AudioBuffer`s used for keyboard sounds instead of `<audio>` elements?

A) Web Audio API has much lower latency, allowing near-instant playback  
B) `<audio>` elements can't play `.mp3` files  
C) `<audio>` elements don't support volume control  
D) Web Audio API is easier to type with TypeScript  

---

**Q5** [Trace] The user has mute enabled in localStorage, but starts playing music via the `play` command. What happens?

A) Music plays silently in the background  
B) An error block appears saying "Cannot play while muted"  
C) The `playLofi()` function forces `setMuted(false)` automatically  
D) Music fails to play  

---

## Answers

---

**A1: B**  
Browsers enforce autoplay policies to prevent annoying the user with unprompted sound. AudioContext and HTMLAudioElement playback must be initiated by a user gesture.

**A2: B** (`src/services/lofi.ts:25-29`)  
`primeLofi()` sets `src` to a silent data URI and calls `play()`. Since this happens in the gesture event handler (`audio.ts`), the browser marks the element as "user-approved".

**A3: C** (`src/hooks/useKeySound.ts:27-31` & `src/lib/keys.ts:16-20`)  
Android keyboards send `Unidentified` / `229` for all keys. `useKeySound` detects this and relies on the `inputChange` event instead. `classifyInputChange` figures out what changed to pick the sound.

**A4: A** (`src/services/keySound.ts` rationale)  
`<audio>` latency is too high (100ms+) for responsive typing sounds. Web Audio API buffers are in memory and play instantly. It also allows overlapping sounds and randomized pitch.

**A5: C** (`src/services/lofi.ts:36`)  
```ts
if (getAudioState().muted) setMuted(false);
```
Playing music intentionally overrides the mute setting, as the user explicitly asked for sound.
