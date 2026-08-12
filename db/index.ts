import type { ProtectionRepositories, TenantScope } from "./contracts";
import { demoRepositories } from "./demo-repositories";
import { postgresRepositories } from "./postgres-repositories";

export function getRepositories(scope?: TenantScope): ProtectionRepositories {
  const durableAvailable = Boolean(
    process.env.POSTGRES_URL && scope?.actorUserId,
  );
  return durableAvailable ? postgresRepositories : demoRepositories;
}
