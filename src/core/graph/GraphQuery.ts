/**
 * Vanguard Core - Graph Query Interface & Helpers
 */

import { GraphNode, GraphNodeType } from './GraphNode';
import { GraphRelationship, RelationshipType } from './GraphRelationship';

export interface GraphQueryFilter {
  type?: GraphNodeType | GraphNodeType[];
  source?: string;
  confidence?: string;
  pathPrefix?: string;
  hasProperty?: string;
  propertyEquals?: { key: string; value: any };
  search?: string;
}

export interface RelatedNodeResult {
  node: GraphNode;
  relationship: GraphRelationship;
  direction: 'outgoing' | 'incoming';
}
