import type { ProtectionRepositories } from "./contracts";
import { demoRepositories } from "./demo-repositories";

export function getRepositories(): ProtectionRepositories {
  const mode = process.env.PERSISTENCE_MODE ?? "demo";
  if (mode === "demo") return demoRepositories;

  throw new Error(
    "PERSISTENCE_MODE=postgres requires the authenticated PostgreSQL adapter before accepting real data.",
  );
}
