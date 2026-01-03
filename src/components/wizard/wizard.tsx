import type { ScrollBoxRenderable } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionPanelOverlay } from '../action-panel';
import type { WizardProps, WizardStepContext, WizardStepState } from './types';
import { WizardContextProvider, type WizardContextValue } from './wizard-context';
import { WizardStep } from './wizard-step';

export function Wizard<TValues extends object>({
    steps,
    initialValues,
    actions,
    onEscape,
    enableCommandPanelShortcut = true,
}: WizardProps<TValues>) {
    const [values, setValues] = useState<TValues>(initialValues);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [focusedStepIndex, setFocusedStepIndex] = useState(0);
    const [stepStates, setStepStates] = useState<Map<number, WizardStepState>>(() => new Map());
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);

    const isSubmittingRef = useRef(false);
    const scrollboxRef = useRef<ScrollBoxRenderable>(null);

    const setValue = useCallback(<K extends keyof TValues>(key: K, value: TValues[K]) => {
        setValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const getStepState = useCallback(
        (index: number): WizardStepState => {
            return stepStates.get(index) ?? { status: 'idle' };
        },
        [stepStates]
    );

    const setStepState = useCallback((index: number, state: Partial<WizardStepState>) => {
        setStepStates(prev => {
            const next = new Map(prev);
            const current = next.get(index) ?? { status: 'idle' };
            next.set(index, { ...current, ...state });
            return next;
        });
    }, []);

    const isStepLocked = useCallback(
        (index: number): boolean => {
            if (index === 0) return false;
            const prevState = getStepState(index - 1);
            return prevState.status !== 'success';
        },
        [getStepState]
    );

    const visibleStepCount = activeStepIndex + 1;

    const resetWizard = useCallback(() => {
        setValues(initialValues);
        setActiveStepIndex(0);
        setFocusedStepIndex(0);
        setStepStates(new Map());
        isSubmittingRef.current = false;
    }, [initialValues]);

    const recenterScrollbox = useCallback(() => {
        const scrollbox = scrollboxRef.current;
        if (!scrollbox) return;

        // get all wizard steps)
        const children = scrollbox.content.getChildren();
        if (children.length === 0) return;

        const viewportHeight = scrollbox.viewport.height;

        // calc heights of all steps
        const stepHeights: number[] = [];
        for (const child of children) {
            if (child) {
                stepHeights.push(child.height);
            }
        }

        const focusedStepHeight = stepHeights[focusedStepIndex] ?? 0;

        // calc Y position of the focused step (before padding)
        let focusedStepY = 0;
        for (let i = 0; i < focusedStepIndex; i++) {
            focusedStepY += stepHeights[i] ?? 0;
        }

        // calc padding needed to allow centering at edges
        // top padding: allows first step to be centered vertically
        const firstStepHeight = stepHeights[0] ?? 0;
        const topPadding = Math.max(0, (viewportHeight - firstStepHeight) / 2);

        // bottom padding: allows last step to be centered vertically
        const lastStepHeight = stepHeights[stepHeights.length - 1] ?? 0;
        const bottomPadding = Math.max(0, (viewportHeight - lastStepHeight) / 2);

        // apply padding to content to enable centering
        scrollbox.content.paddingTop = topPadding;
        scrollbox.content.paddingBottom = bottomPadding;

        // calc scroll position to center the focused step
        const adjustedFocusedStepY = topPadding + focusedStepY;
        const centerOffset = (viewportHeight - focusedStepHeight) / 2;
        const targetScrollTop = Math.max(0, adjustedFocusedStepY - centerOffset);

        scrollbox.scrollTo({ x: 0, y: targetScrollTop });
    }, [focusedStepIndex]);

    useEffect(() => {
        recenterScrollbox();
    }, [recenterScrollbox]);

    const submitFocusedStep = useCallback(async () => {
        if (isSubmittingRef.current) return;

        const step = steps[focusedStepIndex];
        if (!step) return;

        if (isStepLocked(focusedStepIndex)) return;

        isSubmittingRef.current = true;
        setStepState(focusedStepIndex, { status: 'running', error: undefined });

        const nextStepIndex = focusedStepIndex + 1;
        const hasNextStep = nextStepIndex < steps.length;

        if (hasNextStep) {
            setActiveStepIndex(nextStepIndex);
            setFocusedStepIndex(nextStepIndex);
        }

        const locked = isStepLocked(focusedStepIndex);
        const previousStepState =
            focusedStepIndex > 0 ? getStepState(focusedStepIndex - 1) : undefined;

        const stepContext: WizardStepContext<TValues> = {
            values,
            setValue,
            isLocked: locked,
            isFocused: focusedStepIndex === focusedStepIndex,
            previousStepState,
        };

        try {
            const result = await step.onSubmit?.(values, stepContext);
            setStepState(focusedStepIndex, {
                status: 'success',
                data: result,
                error: undefined,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setStepState(focusedStepIndex, {
                status: 'error',
                error: errorMessage,
            });
        } finally {
            isSubmittingRef.current = false;
        }
    }, [focusedStepIndex, steps, values, isStepLocked, setStepState]);

    const navigateNext = useCallback(() => {
        setFocusedStepIndex(i => {
            const next = i + 1;
            if (next > activeStepIndex) return i;
            if (isStepLocked(next)) return i;
            return next;
        });
    }, [activeStepIndex, isStepLocked]);

    const navigatePrev = useCallback(() => {
        setFocusedStepIndex(i => Math.max(0, i - 1));
    }, []);

    const openActionPanel = useCallback(() => {
        setIsActionPanelOpen(true);
    }, []);

    const closeActionPanel = useCallback(() => {
        setIsActionPanelOpen(false);
    }, []);

    useKeyboard(key => {
        if (isActionPanelOpen) {
            if (key.name === 'escape') {
                closeActionPanel();
            }
            return;
        }

        if (key.name === 'escape') {
            resetWizard();
            onEscape?.();
            return;
        }

        if (key.name === 'tab') {
            if (key.shift) {
                navigatePrev();
            } else {
                navigateNext();
            }
            return;
        }

        if (enableCommandPanelShortcut && key.ctrl && key.name === 'k') {
            openActionPanel();
            return;
        }

        // Windows Terminal maps Ctrl+Return to Ctrl+J, so check both
        if (key.ctrl && (key.name === 'return' || key.name === 'j')) {
            submitFocusedStep();
        }
    });

    const contextValue: WizardContextValue = useMemo(
        () => ({
            activeStepIndex,
            focusedStepIndex,
            setFocusedStepIndex,
            visibleStepCount,
            getStepState,
            isStepLocked,
            submitFocusedStep,
            isActionPanelOpen,
            openActionPanel,
            closeActionPanel,
        }),
        [
            activeStepIndex,
            focusedStepIndex,
            visibleStepCount,
            getStepState,
            isStepLocked,
            submitFocusedStep,
            isActionPanelOpen,
            openActionPanel,
            closeActionPanel,
        ]
    );

    const visibleSteps = steps.slice(0, visibleStepCount);

    return (
        <box flexDirection="column" width="100%" flexGrow={1}>
            <WizardContextProvider value={contextValue}>
                <scrollbox
                    ref={scrollboxRef}
                    width="100%"
                    flexGrow={1}
                    focused={false}
                    verticalScrollbarOptions={{
                        visible: false,
                    }}
                >
                    {visibleSteps.map((step, index) => {
                        const stepState = getStepState(index);
                        const locked = isStepLocked(index);
                        const previousStepState = index > 0 ? getStepState(index - 1) : undefined;

                        const stepContext: WizardStepContext<TValues> = {
                            values,
                            setValue,
                            isLocked: locked,
                            isFocused: focusedStepIndex === index,
                            previousStepState,
                        };

                        return (
                            <WizardStep
                                key={step.id}
                                title={step.title}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === visibleSteps.length - 1}
                                status={stepState.status}
                                isLocked={locked}
                            >
                                {step.render(stepContext, recenterScrollbox)}
                            </WizardStep>
                        );
                    })}
                </scrollbox>

                {isActionPanelOpen && actions && (
                    <ActionPanelOverlay onClose={closeActionPanel} onSubmit={submitFocusedStep}>
                        {actions}
                    </ActionPanelOverlay>
                )}
            </WizardContextProvider>
        </box>
    );
}
