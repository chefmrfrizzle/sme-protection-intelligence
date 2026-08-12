import type { z } from "zod";
import type {
  ConnectorCapabilitySchema,
  EvidenceRequestSchema,
  ExposureDifferenceSchema,
  InsuranceContextItemSchema,
  ProfessionalActivitySchema,
  ProfessionalReviewWorkspaceSchema,
  RenewalContextSchema,
  ReviewQueueItemSchema,
} from "./schemas";

export type InsuranceContextItem = z.infer<typeof InsuranceContextItemSchema>;
export type RenewalContext = z.infer<typeof RenewalContextSchema>;
export type ExposureDifference = z.infer<typeof ExposureDifferenceSchema>;
export type EvidenceRequest = z.infer<typeof EvidenceRequestSchema>;
export type ProfessionalActivity = z.infer<typeof ProfessionalActivitySchema>;
export type ReviewQueueItem = z.infer<typeof ReviewQueueItemSchema>;
export type ConnectorCapability = z.infer<typeof ConnectorCapabilitySchema>;
export type ProfessionalReviewWorkspace = z.infer<
  typeof ProfessionalReviewWorkspaceSchema
>;
