/**
 * Vanguard Core - Graph Relationship Definition
 * Directed, typed edges connecting OS & gaming objects in both directions
 */

export type RelationshipType =
  | 'CONTAINS'
  | 'LOCATED_AT'
  | 'MOUNTED_AT'
  | 'PART_OF'
  | 'USES'
  | 'DEPENDS_ON'
  | 'PROVIDES'
  | 'EXECUTABLE_FOR'
  | 'PACKAGE_OWNS'
  | 'VERSION_OF'
  | 'RUNS_WITH'
  | 'PREFIX_FOR'
  | 'PROTON_FOR'
  | 'STEAM_LIBRARY_FOR'
  | 'INSTALLED_IN'
  | 'CONFIGURED_BY'
  | 'LOGGED_BY'
  | 'SAVED_IN'
  | 'ASSOCIATED_WITH'
  | 'PREVIOUSLY_WORKED_WITH'
  | 'PREVIOUSLY_FAILED_WITH'
  | 'RECOMMENDED_FOR';

export interface GraphRelationship {
  id: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  metadata?: Record<string, any>;
  confidence?: 'verified' | 'detected' | 'remembered' | 'inferred';
  timestamp: number;
}
