import {
    useEffect,
    useState,
} from 'react';

import {
    ArrowLeft,
    BookOpen,
} from 'lucide-react';

import type {
    ConceptModel,
    StoryView,
} from '../../../conceptual/src/types/model';
import { DiagramView } from './DiagramView';

interface Props {
    storyView: StoryView;
    model: ConceptModel;
    onBack: () => void;
    selectedConceptId?: string | null;
    onSelectConcept?: (id: string | null) => void;
}

export function StoryDiagramView({
    storyView,
    model,
    onBack,
    selectedConceptId,
    onSelectConcept,
}: Props) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [revealedConceptIds, setRevealedConceptIds] = useState<string[]>([]);
    const [revealedRelationshipIds, setRevealedRelationshipIds] = useState<string[]>([]);

    const totalSteps = storyView.steps.length;
    const canGoPrevious = currentStepIndex > 0;
    const canGoNext = currentStepIndex < totalSteps - 1;

    // Calculate cumulative visible concepts and relationships for the current step
    const visibleSteps = storyView.steps.slice(0, currentStepIndex + 1);

    // Effect to progressively reveal new concepts and relationships in smart order
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

    const currentStep = storyView.steps[currentStepIndex];

    // Create a synthetic view for the diagram
    const syntheticView = {
        id: `${storyView.id}-step-${currentStepIndex}`,
        name: `${storyView.name} - Step ${currentStepIndex + 1}`,
        description: currentStep.title,
        conceptIds: revealedConceptIds,
        relationshipIds: revealedRelationshipIds,
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Model
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Story + Diagram</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{storyView.name}</h1>
                    </div>
                </div>

                {/* Step-through controls */}
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                        disabled={!canGoPrevious}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${canGoPrevious
                            ? 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        ◀ Previous
                    </button>

                    <div className="text-sm font-medium text-indigo-900">
                        Step {currentStepIndex + 1} of {totalSteps}
                    </div>

                    <button
                        onClick={() => setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1))}
                        disabled={!canGoNext}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${canGoNext
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Next ▶
                    </button>
                </div>
            </div>

            {/* Split view: Story + Diagram */}
            <div className="flex-1 flex overflow-hidden">
                {/* Story panel - Timeline view */}
                <div className="w-1/3 overflow-y-auto border-r border-slate-200 bg-white p-6">
                    {/* Timeline */}
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                        <div className="space-y-6">
                            {visibleSteps.map((step) => {
                                const isCurrentStep = step.index === currentStepIndex;

                                return (
                                    <div
                                        key={step.id}
                                        className="relative flex gap-4 transition-all"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm z-10 ${isCurrentStep
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {step.index + 1}
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 pb-4">
                                            <h3 className={`text-base font-semibold mb-2 ${isCurrentStep ? 'text-slate-900' : 'text-slate-700'
                                                }`}>
                                                {step.title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed mb-3 ${isCurrentStep ? 'text-slate-700' : 'text-slate-500'
                                                }`}>
                                                {step.narrative}
                                            </p>

                                            {/* Concepts */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {step.conceptIds.map(conceptId => {
                                                    const concept = model.concepts.find(c => c.id === conceptId);
                                                    return concept ? (
                                                        <button
                                                            key={conceptId}
                                                            onClick={() => onSelectConcept?.(conceptId)}
                                                            className={`px-2 py-0.5 text-xs rounded-md transition-all hover:shadow-sm ${isCurrentStep
                                                                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                                                                }`}
                                                        >
                                                            {concept.label}
                                                        </button>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Diagram panel */}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <DiagramView
                            view={syntheticView}
                            model={model}
                            onBack={onBack}
                            selectedConceptId={selectedConceptId}
                            onSelectConcept={onSelectConcept}
                            visibleConceptIds={revealedConceptIds}
                            visibleRelationshipIds={revealedRelationshipIds}
                            showHeader={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
