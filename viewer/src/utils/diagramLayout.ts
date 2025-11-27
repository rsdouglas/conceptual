import type { Node, Edge } from '@xyflow/react';
import type { ModelView, ConceptModel } from '../../../conceptual/src/types/model';

const CARD_W = 220;
const CARD_H = 120;
const PADDING_X = 24;
const PADDING_Y = 60; // space for group title
const GAP_Y = 50;
const GROUP_SEPARATION = 60;
const GROUP_WIDTH = CARD_W + PADDING_X * 2;

export function buildDiagramGraph(view: ModelView, model: ConceptModel) {
    const conceptMap = new Map(model.concepts.map(c => [c.id, c]));
    const relMap = new Map(model.relationships.map(r => [r.id, r]));

    const groups = view.layout?.groups ?? [];

    // Which concepts are in groups
    const groupedConceptIds = new Set<string>(
        groups.flatMap(g => g.conceptIds ?? []),
    );

    const ungroupedConceptIds = view.conceptIds.filter(
        id => !groupedConceptIds.has(id),
    );

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // --- 1) Build group nodes with our own layout ---------------------

    type LayoutGroup = {
        id: string;
        title?: string;
        x: number;
        y: number;
        width: number;
        height: number;
        conceptIds: string[];
    };

    const layoutGroups: LayoutGroup[] = groups.map((g, index) => {
        const conceptIds = (g.conceptIds ?? []).filter(id =>
            view.conceptIds.includes(id),
        );

        const height =
            PADDING_Y +
            PADDING_X +
            (conceptIds.length > 0
                ? conceptIds.length * (CARD_H + GAP_Y) - GAP_Y
                : CARD_H); // minimum

        const x = index * (GROUP_WIDTH + GROUP_SEPARATION);
        const y = 0;

        const layoutGroup: LayoutGroup = {
            id: g.id,
            title: g.title,
            x,
            y,
            width: GROUP_WIDTH,
            height,
            conceptIds,
        };

        // parent/group node
        nodes.push({
            id: `group-${g.id}`,
            type: 'group',
            position: { x, y },
            data: { title: g.title },
            style: { width: GROUP_WIDTH, height },
            selectable: false,
            draggable: false,
        });

        return layoutGroup;
    });

    // --- 2) Place concept nodes inside their parent groups ------------

    for (const lg of layoutGroups) {
        lg.conceptIds.forEach((conceptId, index) => {
            const concept = conceptMap.get(conceptId);
            if (!concept) return;

            // position is RELATIVE to parent node
            const x = PADDING_X;
            const y = PADDING_Y + index * (CARD_H + GAP_Y);

            nodes.push({
                id: concept.id,
                type: 'concept',
                parentId: `group-${lg.id}`,
                position: { x, y },
                data: {
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                },
                style: { width: CARD_W, },
                extent: 'parent',
            });
        });
    }

    // --- 3) Ungrouped concepts: put them in an "Other" group ----------

    if (ungroupedConceptIds.length > 0) {
        const lastGroupX =
            layoutGroups.length > 0
                ? layoutGroups[layoutGroups.length - 1].x +
                layoutGroups[layoutGroups.length - 1].width
                : 0;

        const x = lastGroupX + GROUP_SEPARATION;
        const y = 0;

        const height =
            PADDING_Y +
            PADDING_X +
            (ungroupedConceptIds.length > 0
                ? ungroupedConceptIds.length * (CARD_H + GAP_Y) - GAP_Y
                : CARD_H);

        nodes.push({
            id: 'group-ungrouped',
            type: 'group',
            position: { x, y },
            data: { title: 'Other' },
            style: { width: GROUP_WIDTH, height },
            selectable: false,
            draggable: false,
        });

        ungroupedConceptIds.forEach((conceptId, index) => {
            const concept = conceptMap.get(conceptId);
            if (!concept) return;

            const nx = PADDING_X;
            const ny = PADDING_Y + index * (CARD_H + GAP_Y);

            nodes.push({
                id: concept.id,
                type: 'concept',
                parentId: 'group-ungrouped',
                position: { x: nx, y: ny },
                data: {
                    label: concept.label,
                    category: concept.category,
                    description: concept.description,
                },
                style: { width: CARD_W },
                extent: 'parent',
            });
        });
    }

    // --- 4) Build edges for relationships in this view ----------------

    for (const relId of view.relationshipIds) {
        const rel = relMap.get(relId);
        if (!rel) continue;
        if (
            !view.conceptIds.includes(rel.from) ||
            !view.conceptIds.includes(rel.to)
        ) {
            continue;
        }

        edges.push({
            id: rel.id,
            source: rel.from,
            target: rel.to,
            type: 'hoverEdge',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            labelStyle: { fontSize: 11, fill: '#64748b' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            data: {
                phrase: rel.phrase,
                category: rel.category,
                description: rel.description,
            },
        });
    }

    return { nodes, edges };
}
