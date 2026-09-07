import { z } from "zod";

export const OrganizationRoleSchema = z.enum([
  "SME_USER",
  "BROKER_RISK_ADVISOR",
  "INSURER_REVIEWER",
  "ADMIN",
]);

export const ProtectedActionSchema = z.enum([
  "VIEW_WORKSPACE",
  "SUBMIT_REVIEW",
  "GENERATE_REPORT",
  "MANAGE_MEMBERS",
  "CONFIGURE_INTEGRATIONS",
  "PROMOTE_FACT",
  "REPLAY_OUTBOUND",
  "ERASE_EVIDENCE",
]);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
export type ProtectedAction = z.infer<typeof ProtectedActionSchema>;

const rolePermissions = {
  SME_USER: ["VIEW_WORKSPACE", "SUBMIT_REVIEW", "GENERATE_REPORT"],
  BROKER_RISK_ADVISOR: [
    "VIEW_WORKSPACE",
    "SUBMIT_REVIEW",
    "GENERATE_REPORT",
    "PROMOTE_FACT",
  ],
  INSURER_REVIEWER: [
    "VIEW_WORKSPACE",
    "SUBMIT_REVIEW",
    "GENERATE_REPORT",
    "PROMOTE_FACT",
  ],
  ADMIN: [
    "VIEW_WORKSPACE",
    "SUBMIT_REVIEW",
    "GENERATE_REPORT",
    "MANAGE_MEMBERS",
    "CONFIGURE_INTEGRATIONS",
    "PROMOTE_FACT",
    "REPLAY_OUTBOUND",
    "ERASE_EVIDENCE",
  ],
} as const satisfies Record<OrganizationRole, readonly ProtectedAction[]>;

export function isAuthorized(role: OrganizationRole, action: ProtectedAction) {
  return (rolePermissions[role] as readonly ProtectedAction[]).includes(action);
}

export function assertAuthorized(
  role: OrganizationRole,
  action: ProtectedAction,
) {
  if (!isAuthorized(role, action)) {
    throw new Error("Organization action is not authorized.");
  }
}

export function permissionsFor(role: OrganizationRole) {
  return [...rolePermissions[role]];
}
