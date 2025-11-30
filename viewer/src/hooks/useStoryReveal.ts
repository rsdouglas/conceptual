import { useEffect, useState } from 'react';
import type { ConceptModel, StoryView } from '../../../conceptual/src/types/model';

interface UseStoryRevealProps {
    storyView: StoryView;
    model: ConceptModel;
    currentStepIndex: number;
}

export function useStoryReveal({ storyView, model, currentStepIndex }: UseStoryRevealProps) {
    const [revealedConceptIds, setRevealedConceptIds] = useState<string[]>([]);
    const [revealedRelationshipIds, setRevealedRelationshipIds] = useState<string[]>([]);

    useEffect(() => {
        const currentStep = storyView.steps[currentStepIndex];
        const previousSteps = storyView.steps.slice(0, currentStepIndex);
        const previousConceptIds = new Set(previousSteps.flatMap(step => step.conceptIds));
        const previousRelationshipIds = new Set(previousSteps.flatMap(step => step.relationshipIds));

        // If going to step 0, reset immediately
        if (currentStepIndex === 0) {
            setRevealedConceptIds(currentStep.conceptIds);
            setRevealedRelationshipIds(currentStep.relationshipIds);
            return;
        }

        // Start with previously revealed items
        const baseConceptIds = [...previousConceptIds];
        const baseRelationshipIds = [...previousRelationshipIds];

        setRevealedConceptIds(baseConceptIds);
        setRevealedRelationshipIds(baseRelationshipIds);

        // Identify new items in this step
        const newConceptIds = currentStep.conceptIds.filter(id => !previousConceptIds.has(id));
        const newRelationshipIds = currentStep.relationshipIds.filter(id => !previousRelationshipIds.has(id));

        // Build reveal sequence with smarter ordering:
        // 1. Relationships between existing concepts
        // 2. New concept + its relationships, one at a time
        const revealQueue: Array<{ type: 'concept' | 'relationship', id: string }> = [];

        // Find relationships that only connect existing concepts
        const relationshipsBetweenExisting = newRelationshipIds.filter(relId => {
            const rel = model.relationships.find(r => r.id === relId);
            if (!rel) return false;
            return previousConceptIds.has(rel.from) && previousConceptIds.has(rel.to);
        });

        // Add relationships between existing concepts first
        relationshipsBetweenExisting.forEach(relId => {
            revealQueue.push({ type: 'relationship', id: relId });
        });

        // For each new concept, add it followed by its relationships
        newConceptIds.forEach(conceptId => {
            revealQueue.push({ type: 'concept', id: conceptId });

            // Find relationships connected to this concept
            const relatedRelationships = newRelationshipIds.filter(relId => {
                const rel = model.relationships.find(r => r.id === relId);
                if (!rel) return false;
                return rel.from === conceptId || rel.to === conceptId;
            });

            relatedRelationships.forEach(relId => {
                revealQueue.push({ type: 'relationship', id: relId });
            });
        });

        // Remove duplicates while preserving order
        const seenRels = new Set<string>();
        const uniqueQueue = revealQueue.filter(item => {
            if (item.type === 'relationship') {
                if (seenRels.has(item.id)) return false;
                seenRels.add(item.id);
            }
            return true;
        });

        // Progressively reveal items from the queue
        const delays: (() => void)[] = [];

        uniqueQueue.forEach((item, index) => {
            const timeoutId = setTimeout(() => {
                if (item.type === 'concept') {
                    setRevealedConceptIds(prev => [...prev, item.id]);
                } else {
                    setRevealedRelationshipIds(prev => [...prev, item.id]);
                }
            }, (index + 1) * 1000);
            delays.push(() => clearTimeout(timeoutId));
        });

        // Cleanup timeouts on unmount or step change
        return () => {
            delays.forEach(clear => clear());
        };
    }, [currentStepIndex, storyView.steps, model.relationships]);

    return {
        revealedConceptIds,
        revealedRelationshipIds,
    };
}
