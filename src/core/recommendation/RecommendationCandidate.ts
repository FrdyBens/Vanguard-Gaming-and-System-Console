/**
 * Vanguard Core - Recommendation Candidate & Evidence
 * Transparent recommendation model with explicit rationale and warnings
 */

export type EvidenceType =
  | 'previousSuccess'
  | 'previousFailure'
  | 'installed'
  | 'compatible'
  | 'machineMatch'
  | 'gameMatch'
  | 'userPreference'
  | 'documentationMatch'
  | 'communityCompatibility'
  | 'runtimeAvailability'
  | 'recentSuccess'
  | 'recentFailure';

export interface RecommendationEvidence {
  type: EvidenceType;
  description: string;
  weight?: 'strong' | 'moderate' | 'supporting';
}

export interface RecommendationCandidate {
  candidate: string;
  title: string;
  type: 'wine_version' | 'proton_version' | 'prefix' | 'mount_flags' | 'tool' | 'workflow';
  confidence: 'verified' | 'high' | 'medium' | 'low';
  evidence: RecommendationEvidence[];
  reasons: string[];
  warnings: string[];
  alternatives: string[];
  commandTemplate?: string;
}
