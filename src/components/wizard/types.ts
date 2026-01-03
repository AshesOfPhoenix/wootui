import type { ReactNode } from 'react';

/**
 * Status of a wizard step
 */
export type WizardStepStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * State for a single wizard step
 */
export interface WizardStepState<TData = unknown> {
    /** Current status of the step */
    status: WizardStepStatus;
    /** Error message if status is 'error' */
    error?: string;
    /** Result data if status is 'success' */
    data?: TData;
}

/**
 * Context passed to step render and submit functions
 */
export interface WizardStepContext<TValues extends object> {
    /** Current form values */
    values: TValues;
    /** Update a single value */
    setValue: <K extends keyof TValues>(key: K, value: TValues[K]) => void;
    /** Whether this step is locked (previous step not yet successful) */
    isLocked: boolean;
    /** Whether this step is currently focused */
    isFocused: boolean;
    /** State of the previous step (for displaying errors/status) */
    previousStepState?: WizardStepState;
}

/**
 * Definition for a wizard step
 */
export interface WizardStepDefinition<TValues extends object> {
    /** Unique identifier for the step */
    id: string;
    /** Title displayed for the step */
    title: string;
    /** Render function for the step content */
    render: (ctx: WizardStepContext<TValues>, recenterScrollbox?: () => void) => ReactNode;
    /** Optional async submit handler - called when ctrl+return is pressed on this step */
    onSubmit?: (values: TValues, context: WizardStepContext<TValues>) => Promise<unknown> | unknown;
}

/**
 * Props for the Wizard component
 */
export interface WizardProps<TValues extends object> {
    /** Step definitions */
    steps: WizardStepDefinition<TValues>[];
    /** Initial form values */
    initialValues: TValues;
    /** Optional action panel */
    actions?: ReactNode;
    /** Escape key handler */
    onEscape?: () => void;
    /** Enable ctrl+k command panel shortcut (default: true) */
    enableCommandPanelShortcut?: boolean;
}
