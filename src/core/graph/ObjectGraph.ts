/**
 * Vanguard Core - ObjectGraph Implementation
 * Fast in-memory bidirectional knowledge graph for operating system & gaming entities
 */

import { GraphNode, GraphNodeType, NodeConfidence, NodeSource } from './GraphNode';
import { GraphRelationship, RelationshipType } from './GraphRelationship';
import { GraphQueryFilter, RelatedNodeResult } from './GraphQuery';

export class ObjectGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private stableIdIndex: Map<string, string> = new Map(); // stableId -> id
  private pathIndex: Map<string, string> = new Map(); // normalizedPath -> id
  private relationships: Map<string, GraphRelationship> = new Map();
  private outgoingEdges: Map<string, Set<string>> = new Map(); // fromId -> Set of relIds
  private incomingEdges: Map<string, Set<string>> = new Map(); // toId -> Set of relIds

  /**
   * Add or update a node in the graph
   */
  public upsertNode<T = Record<string, any>>(node: GraphNode<T>): GraphNode<T> {
    this.nodes.set(node.id, node as unknown as GraphNode);
    if (node.stableId) {
      this.stableIdIndex.set(node.stableId, node.id);
    }
    if (node.path) {
      this.pathIndex.set(this.normalizePath(node.path), node.id);
    }
    return node;
  }

  /**
   * Add a relationship between two nodes
   */
  public addRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>,
    confidence: 'verified' | 'detected' | 'remembered' | 'inferred' = 'verified'
  ): GraphRelationship {
    const id = `rel-${fromId}-${type}-${toId}`;
    const rel: GraphRelationship = {
      id,
      fromId,
      toId,
      type,
      metadata,
      confidence,
      timestamp: Date.now()
    };

    this.relationships.set(id, rel);

    if (!this.outgoingEdges.has(fromId)) {
      this.outgoingEdges.set(fromId, new Set());
    }
    this.outgoingEdges.get(fromId)!.add(id);

    if (!this.incomingEdges.has(toId)) {
      this.incomingEdges.set(toId, new Set());
    }
    this.incomingEdges.get(toId)!.add(id);

    return rel;
  }

  public getNode(idOrPathOrStableId: string): GraphNode | undefined {
    if (this.nodes.has(idOrPathOrStableId)) {
      return this.nodes.get(idOrPathOrStableId);
    }
    const fromStable = this.stableIdIndex.get(idOrPathOrStableId);
    if (fromStable && this.nodes.has(fromStable)) {
      return this.nodes.get(fromStable);
    }
    const fromPath = this.pathIndex.get(this.normalizePath(idOrPathOrStableId));
    if (fromPath && this.nodes.has(fromPath)) {
      return this.nodes.get(fromPath);
    }
    return undefined;
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllRelationships(): GraphRelationship[] {
    return Array.from(this.relationships.values());
  }

  public removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove indexes
    if (node.stableId) this.stableIdIndex.delete(node.stableId);
    if (node.path) this.pathIndex.delete(this.normalizePath(node.path));

    // Remove relationships
    const outgoing = this.outgoingEdges.get(id) || new Set();
    outgoing.forEach((relId) => {
      const rel = this.relationships.get(relId);
      if (rel) {
        this.incomingEdges.get(rel.toId)?.delete(relId);
        this.relationships.delete(relId);
      }
    });
    this.outgoingEdges.delete(id);

    const incoming = this.incomingEdges.get(id) || new Set();
    incoming.forEach((relId) => {
      const rel = this.relationships.get(relId);
      if (rel) {
        this.outgoingEdges.get(rel.fromId)?.delete(relId);
        this.relationships.delete(relId);
      }
    });
    this.incomingEdges.delete(id);

    this.nodes.delete(id);
    return true;
  }

  /**
   * Traverse related nodes in either direction
   */
  public getRelatedNodes(
    nodeId: string,
    relType?: RelationshipType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): RelatedNodeResult[] {
    const results: RelatedNodeResult[] = [];

    if (direction === 'outgoing' || direction === 'both') {
      const edgeIds = this.outgoingEdges.get(nodeId);
      if (edgeIds) {
        for (const edgeId of edgeIds) {
          const rel = this.relationships.get(edgeId);
          if (rel && (!relType || rel.type === relType)) {
            const targetNode = this.nodes.get(rel.toId);
            if (targetNode) {
              results.push({ node: targetNode, relationship: rel, direction: 'outgoing' });
            }
          }
        }
      }
    }

    if (direction === 'incoming' || direction === 'both') {
      const edgeIds = this.incomingEdges.get(nodeId);
      if (edgeIds) {
        for (const edgeId of edgeIds) {
          const rel = this.relationships.get(edgeId);
          if (rel && (!relType || rel.type === relType)) {
            const sourceNode = this.nodes.get(rel.fromId);
            if (sourceNode) {
              results.push({ node: sourceNode, relationship: rel, direction: 'incoming' });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Find everything related to an object (BFS up to maxDepth)
   */
  public findEverythingRelated(startNodeId: string, maxDepth = 2): GraphNode[] {
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];
    const related: GraphNode[] = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      if (id !== startNodeId) {
        const node = this.nodes.get(id);
        if (node) related.push(node);
      }

      if (depth < maxDepth) {
        const neighbors = this.getRelatedNodes(id, undefined, 'both');
        for (const n of neighbors) {
          if (!visited.has(n.node.id)) {
            queue.push({ id: n.node.id, depth: depth + 1 });
          }
        }
      }
    }

    return related;
  }

  /**
   * Filter and search graph nodes
   */
  public query(filter: GraphQueryFilter): GraphNode[] {
    return Array.from(this.nodes.values()).filter((node) => {
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (!types.includes(node.type)) return false;
      }
      if (filter.source && node.source !== filter.source) return false;
      if (filter.confidence && node.confidence !== filter.confidence) return false;
      if (filter.pathPrefix) {
        if (!node.path || !node.path.startsWith(filter.pathPrefix)) return false;
      }
      if (filter.hasProperty && !(filter.hasProperty in node.properties)) return false;
      if (filter.propertyEquals) {
        if (node.properties[filter.propertyEquals.key] !== filter.propertyEquals.value) return false;
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const match =
          node.displayName.toLowerCase().includes(s) ||
          (node.path && node.path.toLowerCase().includes(s)) ||
          node.stableId.toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }

  private normalizePath(path: string): string {
    if (!path) return '';
    return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  }
}
