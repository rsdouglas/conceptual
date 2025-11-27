import type { Node, Edge } from '@xyflow/react';
import type { ModelView, ConceptModel } from '../../../conceptual/src/types/model';

const CARD_W = 220;
const CARD_H = 120;
const PADDING_X = 24;
const PADDING_Y = 60; // Extra padding for group title
const GAP_Y = 16;
const GROUP_SEPARATION = 60; // Minimum horizontal/vertical spacing between groups

export function buildDiagramGraph(view: ModelView, model: ConceptModel) {
    const conceptMap = new Map(model.concepts.map(c => [c.id, c]));
    const relMap = new Map(model.relationships.map(r => [r.id, r]));

    const groups = view.layout?.groups ?? [];

    // Track which concepts are in groups
    const groupedConceptIds = new Set<string>(
        groups.flatMap(g => g.conceptIds ?? [])
    );

    // Concepts in the view but not in any group
    const ungroupedConceptIds = view.conceptIds.filter(
        id => !groupedConceptIds.has(id)
    );

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1) Create group background boxes
    for (const g of groups) {
        nodes.push({
            id: `group-${g.id}`,
            type: 'group',
            position: { x: g.x, y: g.y },
            data: { title: g.title },
            style: {
                width: g.width,
                height: g.height,
            },
            selectable: false,
            draggable: false,
        });
    }

    // 2) Place concept nodes inside groups - center them vertically
    for (const g of groups) {
        const ids = (g.conceptIds ?? []).filter(id => view.conceptIds.includes(id));

        ids.forEach((conceptId, index) => {
            const concept = conceptMap.get(conceptId);
            if (!concept) return;

            // Center nodes horizontally within the group
            const nodeX = g.x + (g.width - CARD_W) / 2;

            // Stack vertically with padding from title
            const nodeY = g.y + PADDING_Y + index * (CARD_H + GAP_Y);

            // Ensure node stays within group bounds
            const maxX = g.x + g.width - CARD_W - PADDING_X;
            const maxY = g.y + g.height - CARD_H - PADDING_X;
            const finalX = Math.max(g.x + PADDING_X, Math.min(nodeX, maxX));
            const finalY = Math.max(g.y + PADDING_Y, Math.min(nodeY, maxY));

            nodes.push({
                id: concept.id,
                type: 'concept',
                position: { x: finalX, y: finalY },
                data: {
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                },
                style: {
                    width: CARD_W,
                    height: CARD_H,
                },
            });
        });
    }

    // 3) Ungrouped concepts - create an "Other" group on the right
    if (ungroupedConceptIds.length > 0) {
        const laneX = Math.max(...groups.map(g => g.x + g.width), 0) + GROUP_SEPARATION;
        const laneY = 60;
        const laneHeight = PADDING_Y + PADDING_X + ungroupedConceptIds.length * (CARD_H + GAP_Y) - GAP_Y;

        nodes.push({
            id: 'group-ungrouped',
            type: 'group',
            position: { x: laneX, y: laneY },
            data: { title: 'Other' },
            style: {
                width: CARD_W + PADDING_X * 2,
                height: laneHeight,
            },
            selectable: false,
            draggable: false,
        });

        ungroupedConceptIds.forEach((conceptId, index) => {
            const concept = conceptMap.get(conceptId);
            if (!concept) return;

            // Center horizontally within the "Other" group
            const x = laneX + PADDING_X;
            const y = laneY + PADDING_Y + index * (CARD_H + GAP_Y);

            nodes.push({
                id: concept.id,
                type: 'concept',
                position: { x, y },
                data: {
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                },
                style: {
                    width: CARD_W,
                    height: CARD_H,
                },
            });
        });
    }

    // 4) Create edges - only for relationships in this view
    for (const relId of view.relationshipIds) {
        const rel = relMap.get(relId);
        if (!rel) continue;

        // Only draw edges where both endpoints are in this view
        if (!view.conceptIds.includes(rel.from) || !view.conceptIds.includes(rel.to)) {
            continue;
        }

        edges.push({
            id: rel.id,
            source: rel.from,
            target: rel.to,
            type: 'smoothstep',
            label: rel.phrase,
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            labelStyle: { fontSize: 11, fill: '#64748b' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            data: {
                category: rel.category,
                description: rel.description
            },
        });
    }

    return { nodes, edges };
}
