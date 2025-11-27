import type {
  ConceptModel,
  ModelView,
} from '../../../conceptual/src/types/model';

export interface GraphNode {
    id: string;
    type: 'concept' | 'group';
    data: {
        label: string;
        category?: string;
        description?: string;
        title?: string;
    };
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    data: {
        phrase?: string;
        category?: string;
        description?: string;
    };
}

export function buildDiagramGraph(view: ModelView, model: ConceptModel) {
    const conceptMap = new Map(model.concepts.map(c => [c.id, c]));
    const relMap = new Map(model.relationships.map(r => [r.id, r]));

    // Collect all concept IDs that should be in this view:
    // 1. Concepts explicitly listed in view.conceptIds that exist in the model
    // 2. Concepts referenced in relationships that are in view.relationshipIds
    const conceptIds = new Set<string>();

    // Add concepts explicitly listed in the view (if they exist in model)
    view.conceptIds.forEach(id => {
        if (conceptMap.has(id)) {
            conceptIds.add(id);
        }
    });

    // Add concepts referenced in relationships in this view
    view.relationshipIds.forEach(relId => {
        const rel = relMap.get(relId);
        if (rel) {
            conceptIds.add(rel.from);
            conceptIds.add(rel.to);
        }
    });

    const nodes: GraphNode[] = Array.from(conceptIds).map(conceptId => {
        const concept = conceptMap.get(conceptId);
        if (concept) {
            // Concept exists in model
            return {
                id: concept.id,
                type: 'concept',
                data: {
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                },
            };
        } else {
            // Concept doesn't exist in model - create a minimal one
            return {
                id: conceptId,
                type: 'concept',
                data: {
                    label: conceptId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    category: 'unknown',
                    description: `Concept referenced in relationships but not defined in model`,
                },
            };
        }
    });

    const edges: GraphEdge[] = [];
    const edgeMap = new Map<string, GraphEdge>();

    // Build edges for relationships in this view, deduplicating by source-target pair
    for (const relId of view.relationshipIds) {
        const rel = relMap.get(relId);
        if (!rel) continue;

        // Create a unique key for this edge pair (sorted to handle bidirectional duplicates)
        const nodes = [rel.from, rel.to].sort();
        const edgeKey = `${nodes[0]}<->${nodes[1]}`;

        // Only add if we haven't seen this pair before
        if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, {
                id: rel.id,
                source: rel.from,
                target: rel.to,
                data: {
                    phrase: rel.phrase,
                    category: rel.category,
                    description: rel.description,
                },
            });
        }
    }

    // Convert map to array
    edges.push(...Array.from(edgeMap.values()));

    return { nodes, edges };
}
