import { useEffect } from "react";
import { LazyMotion } from "motion/react";
import StatusBar from "@/components/layout/StatusBar";
import Terminal from "@/components/terminal/Terminal";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { initAnalytics } from "@/services/analytics";
import { initAudio } from "@/services/audio";
import { watchPageShow } from "@/services/leave";
import { preloadAssets } from "@/services/preload";

const loadMotionFeatures = () => import("@/lib/motionFeatures").then((module) => module.default);

export default function App() {
  useViewportHeight();

  useEffect(() => {
    preloadAssets();
    initAnalytics();
    const stopAudio = initAudio();
    const stopPageShow = watchPageShow();
    return () => {
      stopAudio();
      stopPageShow();
    };
  }, []);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div className="fixed inset-x-0 top-[var(--app-top,0px)] flex h-[var(--app-height,100dvh)] flex-col bg-neutral-900 text-neutral-200">
        <StatusBar />
        <Terminal />
      </div>
    </LazyMotion>
  );
}
