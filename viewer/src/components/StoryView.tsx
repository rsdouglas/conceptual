import { useEffect, useState } from 'react';
import {
    BookOpen,
    ChevronRight,
    Network,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import type {
    ConceptModel,
    StoryView as StoryViewType,
} from '../../../conceptual/src/types/model';
import { useStoryReveal } from '../hooks/useStoryReveal';
import { DiagramView } from './DiagramView';

interface Props {
    storyView: StoryViewType;
    model: ConceptModel;
    onBack: () => void;
    onSelectConcept: (id: string) => void;
    navigate: any;
}

export function StoryView({ storyView, model, onBack, onSelectConcept, navigate }: Props) {
    const [stepThroughMode, setStepThroughMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showDiagram, setShowDiagram] = useState(false);
    const location = useLocation();

    // Reset state when story changes
    useEffect(() => {
        setStepThroughMode(false);
        setCurrentStepIndex(0);
        setShowDiagram(false);
    }, [storyView.id]);

    const totalSteps = storyView.steps.length;
    const visibleSteps = stepThroughMode
        ? storyView.steps.slice(0, currentStepIndex + 1)
        : storyView.steps;

    const canGoPrevious = currentStepIndex > 0;
    const canGoNext = currentStepIndex < totalSteps - 1;

    // Use the hook to track revealed concepts/relationships
    const { revealedConceptIds, revealedRelationshipIds } = useStoryReveal({
        storyView,
        model,
        currentStepIndex: stepThroughMode ? currentStepIndex : totalSteps - 1, // Show all if not in step mode
    });

    const handleToggleStepThrough = () => {
        setStepThroughMode(!stepThroughMode);
        if (!stepThroughMode) {
            setCurrentStepIndex(0); // Reset to first step when entering step-through mode
        }
    };

    const currentStep = storyView.steps[currentStepIndex];

    // Create a synthetic view for the diagram
    const syntheticView = {
        id: `${storyView.id}-step-${currentStepIndex}`,
        name: `${storyView.name} - Step ${currentStepIndex + 1}`,
        description: currentStep?.title || storyView.description,
        conceptIds: revealedConceptIds,
        relationshipIds: revealedRelationshipIds,
    };

    return (
        <div className="h-full flex overflow-hidden">
            {/* Left Panel: Story Timeline */}
            <div className={`flex-1 overflow-y-auto bg-white transition-all duration-300 ${showDiagram ? 'w-1/2 max-w-xl border-r border-slate-200' : 'w-full max-w-4xl mx-auto'}`}>
                <div className="p-8">
                    <div className="mb-8">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Back to Model
                        </button>

                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <BookOpen className="w-4 h-4" />
                            <span>Story View</span>
                        </div>

                        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">{storyView.name}</h1>
                                <p className="text-slate-600 mb-4">{storyView.description}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDiagram(!showDiagram)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${showDiagram
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Network className="w-4 h-4" />
                                    {showDiagram ? 'Hide Diagram' : 'Show Diagram'}
                                </button>

                                <button
                                    onClick={handleToggleStepThrough}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${stepThroughMode
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {stepThroughMode ? 'Exit Step Mode' : 'Step Through'}
                                </button>
                            </div>
                        </div>

                        {storyView.tags && storyView.tags.length > 0 && (
                            <div className="flex gap-2 mb-8">
                                {storyView.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Step-through controls */}
                    {stepThroughMode && (
                        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
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
                    )}

                    {/* Vertical Timeline */}
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                        <div className="space-y-8">
                            {visibleSteps.map((step) => {
                                const isCurrentStep = stepThroughMode && step.index === currentStepIndex;

                                return (
                                    <div
                                        key={step.id}
                                        className={`relative flex gap-6 transition-all duration-500 ${isCurrentStep ? 'opacity-100 scale-100' : 'opacity-80'}`}
                                        ref={el => {
                                            if (isCurrentStep && el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm z-10 transition-colors duration-300 ${isCurrentStep
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {step.index + 1}
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 pb-8">
                                            <h3 className={`text-lg font-semibold mb-2 transition-colors ${isCurrentStep ? 'text-indigo-900' : 'text-slate-900'}`}>{step.title}</h3>
                                            <p className="text-slate-700 leading-relaxed mb-4">{step.narrative}</p>

                                            {/* Concepts */}
                                            <div className="flex flex-wrap gap-2">
                                                {step.conceptIds.map(conceptId => {
                                                    const concept = model.concepts.find(c => c.id === conceptId);
                                                    return concept ? (
                                                        <button
                                                            key={conceptId}
                                                            onClick={() => onSelectConcept(conceptId)}
                                                            className="px-2 py-1 text-xs rounded-md transition-all hover:shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
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
            </div>

            {/* Right Panel: Diagram */}
            {showDiagram && (
                <div className="flex-1 bg-slate-50 relative border-l border-slate-200">
                    <div className="absolute inset-0">
                        <DiagramView
                            view={syntheticView}
                            model={model}
                            onBack={() => { }} // No back button needed in split view
                            selectedConceptId={null} // Could wire this up to selection if desired
                            onSelectConcept={onSelectConcept}
                            visibleConceptIds={revealedConceptIds}
                            visibleRelationshipIds={revealedRelationshipIds}
                            showHeader={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
