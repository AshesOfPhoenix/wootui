import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';

const COLORS = {
    on: '#22c55e',
    off: '#666666',
    focused: '#c9a227',
    unfocused: '#ffffff',
} as const;

const TRACK = {
    off: '○───',
    on: '───●',
} as const;

export interface ToggleProps {
    /** Label displayed next to the toggle */
    label: string;
    /** Current toggle state */
    value: boolean;
    /** Callback when toggle state changes */
    onChange: (value: boolean) => void;
    /** Whether this toggle is currently focused */
    isFocused?: boolean;
}

/**
 * A terminal-style toggle switch component.
 * Toggleable via Space or Enter when focused.
 */
export function Toggle({ label, value, onChange, isFocused = false }: ToggleProps) {
    useKeyboard(key => {
        if (!isFocused) return;
        if (key.name === 'space' || key.name === 'return') {
            onChange(!value);
        }
    });

    const track = value ? TRACK.on : TRACK.off;
    const trackColor = value ? COLORS.on : COLORS.off;
    const labelColor = isFocused ? COLORS.focused : COLORS.unfocused;

    return (
        <box flexDirection="row" columnGap={1}>
            <text fg={labelColor} attributes={isFocused ? TextAttributes.BOLD : 0}>
                {label}
            </text>
            {/** biome-ignore lint/a11y/noStaticElementInteractions: Terminal UI handles interaction separately */}
            <text
                fg={trackColor}
                attributes={value ? TextAttributes.BOLD : TextAttributes.DIM}
                onMouseDown={() => onChange(!value)}
            >
                [{track}]
            </text>
        </box>
    );
}
