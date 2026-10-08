// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAnalytics, trackCommand } from "@/services/analytics";
import { projects } from "@/data/projects";

const makeTrack = () => vi.fn<(event: string, data?: Record<string, string | number>) => void>();
const ID = "11111111-2222-3333-4444-555555555555";
const scripts = () => Array.from(document.head.querySelectorAll<HTMLScriptElement>("script#umami-script"));
const live = { websiteId: ID, dev: false };

function setDoNotTrack(value: string | null) {
  Object.defineProperty(navigator, "doNotTrack", { value, configurable: true });
}

beforeEach(() => {
  document.head.innerHTML = "";
  setDoNotTrack(null);
});
afterEach(() => {
  delete window.umami;
});

describe("initAnalytics", () => {
  it("adds the Umami script with the website id, only the real domain, and Do Not Track on", () => {
    initAnalytics({ ...live, siteUrl: "https://cli.example.in/" });
    const [script] = scripts();
    expect(scripts()).toHaveLength(1);
    expect(script.src).toBe("https://cloud.umami.is/script.js");
    expect(script.defer).toBe(true);
    expect(script.dataset.websiteId).toBe(ID);
    expect(script.dataset.domains).toBe("cli.example.in");
    expect(script.dataset.doNotTrack).toBe("true");
  });

  it("is safe to call twice", () => {
    initAnalytics(live);
    initAnalytics(live);
    expect(scripts()).toHaveLength(1);
  });

  it("can point at a self-hosted script", () => {
    initAnalytics({ ...live, src: "https://stats.example.in/script.js" });
    expect(scripts()[0].src).toBe("https://stats.example.in/script.js");
  });

  it("does not limit domains when the site URL is missing or not a URL", () => {
    initAnalytics({ ...live, siteUrl: "not a url" });
    expect(scripts()[0].dataset.domains).toBeUndefined();
  });

  it("does nothing without a website id", () => {
    initAnalytics({ websiteId: "", dev: false });
    initAnalytics({ websiteId: undefined, dev: false });
    expect(scripts()).toHaveLength(0);
  });

  it("does nothing in development", () => {
    initAnalytics({ websiteId: ID, dev: true });
    expect(scripts()).toHaveLength(0);
  });

  it("does nothing when the browser says Do Not Track", () => {
    setDoNotTrack("1");
    initAnalytics(live);
    expect(scripts()).toHaveLength(0);
  });
});

describe("trackCommand", () => {
  const first = projects[0].slug;
  const second = projects[1].slug;
  let track: ReturnType<typeof makeTrack>;
  const calls = () => track.mock.calls;

  beforeEach(() => {
    track = makeTrack();
    window.umami = { track };
  });

  it("reports the command name for known commands", () => {
    trackCommand("ls projects");
    expect(calls()).toEqual([["command", { name: "ls" }]]);
  });

  it("reports aliases under the real command name", () => {
    trackCommand("HELP");
    trackCommand("?");
    trackCommand("hello");
    expect(calls().map((call) => call[1]?.name)).toEqual(["rosh", "rosh", "hi"]);
  });

  it("never sends what was typed for unknown commands", () => {
    trackCommand("my-secret-password hunter2");
    trackCommand("sudo rm -rf /home/someone@example.com");
    expect(calls()).toEqual([
      ["command", { name: "unknown" }],
      ["command", { name: "unknown" }],
    ]);
    expect(JSON.stringify(calls())).not.toMatch(/secret|hunter2|someone|example\.com/);
  });

  it("never sends invented arguments for known commands either", () => {
    trackCommand("cat nobody@example.com.txt");
    trackCommand("run something-private");
    trackCommand("keyboard my-private-name");
    expect(JSON.stringify(calls())).not.toMatch(/nobody|private|example/);
  });

  it("reports which project was read, and which was opened", () => {
    trackCommand(`cat ${first}.txt`);
    trackCommand(`run ${second}`);
    expect(calls()).toEqual([
      ["command", { name: "cat" }],
      ["project-view", { slug: first }],
      ["command", { name: "run" }],
      ["project-open", { slug: second }],
    ]);
  });

  it("reports resume downloads", () => {
    trackCommand("run resume");
    expect(calls()).toEqual([["command", { name: "run" }], ["resume-download"]]);
  });

  it("matches however the command was typed", () => {
    trackCommand(`  CAT   ${first.toUpperCase()}.TXT `);
    expect(calls()[1]).toEqual(["project-view", { slug: first }]);
  });

  it("reports only the command for files that are not projects", () => {
    trackCommand("cat experience.txt");
    trackCommand("cat stack.json");
    expect(calls().map((call) => call[0])).toEqual(["command", "command"]);
  });

  it("ignores empty input", () => {
    trackCommand("");
    trackCommand("   ");
    expect(track).not.toHaveBeenCalled();
  });

  it("never throws, whether Umami is missing, blocked or broken", () => {
    delete window.umami;
    expect(() => trackCommand("ls projects")).not.toThrow();
    window.umami = {
      track: () => {
        throw new Error("blocked");
      },
    };
    expect(() => trackCommand("ls projects")).not.toThrow();
  });
});
