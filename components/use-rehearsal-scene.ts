"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DemoScene } from "@/domain/rehearsal/demo-script";
import { useDemo } from "./demo-provider";

export function useOpenRehearsalScene() {
  const router = useRouter();
  const { applyEvent, reset, setLens } = useDemo();

  return useCallback(
    (scene: DemoScene) => {
      switch (scene.setup) {
        case "RESET_BASELINE":
        case "SHOW_BASELINE":
          reset();
          setLens("simple");
          break;
        case "APPLY_WAREHOUSE":
        case "OPEN_WAREHOUSE_FINDING":
          reset();
          applyEvent("event_new_warehouse");
          setLens("simple");
          break;
        case "SHOW_WAREHOUSE_EVIDENCE":
          reset();
          applyEvent("event_new_warehouse");
          setLens("evidence");
          break;
        case "SHOW_CHALLENGE":
          reset();
          applyEvent("event_new_warehouse");
          setLens("insurance");
          break;
        case "APPLY_CLOUD_ABSTENTION":
        case "OPEN_PROFESSIONAL_REVIEW":
          reset();
          applyEvent("event_new_warehouse");
          applyEvent("event_cloud_dependency");
          setLens("simple");
          break;
        case "OPEN_REPORT":
          applyEvent("event_new_warehouse");
          applyEvent("event_cloud_dependency");
          setLens("evidence");
          break;
        case "OPEN_AUDIT":
          applyEvent("event_new_warehouse");
          applyEvent("event_cloud_dependency");
          break;
      }
      router.push(scene.path);
    },
    [applyEvent, reset, router, setLens],
  );
}
