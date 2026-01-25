import { SkillPrimitive } from "../skill_primitives/SkillPrimitive";

export interface CapabilityNode {
  skillId: string;
  /** Directly attaches the primitive for fast lookup */
  primitive: SkillPrimitive;
  /** Edges – other skills this node depends on / complements */
  edges: Set<string>; // skillIds of neighbours
}

/**
 * Simple in‑memory adjacency map.
 */
export class CapabilityGraph {
  /** key = skillId */
  private nodes = new Map<string, CapabilityNode>();

  /** Add a node (or replace if it already exists) */
  addNode(node: CapabilityNode): void {
    this.nodes.set(node.skillId, node);
  }

  /** Connect two skills (directed) */
  addEdge(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    if (from) from.edges.add(toId);
  }

  /** Retrieve node */
  getNode(id: string): CapabilityNode | undefined {
    return this.nodes.get(id);
  }

  /** Iterate over all nodes */
  *[Symbol.iterator](): IterableIterator<CapabilityNode> {
    yield* this.nodes.values();
  }
}
