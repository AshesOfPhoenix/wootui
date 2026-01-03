import { TextAttributes } from '@opentui/core';
import { COLORS, ICONS, formatShortcut, type KeyboardShortcut } from '../form/constants';

export interface ActionItemProps {
    /** Action title */
    title: string;
    /** Icon to display */
    icon?: string;
    /** Keyboard shortcut */
    shortcut?: KeyboardShortcut;
    /** Whether this action is selected */
    isSelected?: boolean;
    /** Click handler */
    onMouseDown?: () => void;
}

export function ActionItem({
    title,
    icon,
    shortcut,
    isSelected = false,
    onMouseDown,
}: ActionItemProps) {
    const prefix = isSelected
        ? `${ICONS.optionArrow}${ICONS.actionSelected}`
        : ` ${ICONS.actionEmpty}`;

    return (
        <box
            flexDirection="row"
            justifyContent="space-between"
            onMouseDown={onMouseDown}
            backgroundColor={isSelected ? COLORS.selectedBackground : undefined}
            paddingLeft={1}
            paddingRight={1}
        >
            <box flexDirection="row">
                <text fg={isSelected ? '#000000' : COLORS.unfocused}>
                    {prefix} {title}
                </text>
            </box>
            {shortcut && (
                <text
                    fg={isSelected ? '#000000' : COLORS.unfocused}
                    attributes={isSelected ? TextAttributes.NONE : TextAttributes.DIM}
                >
                    {formatShortcut(shortcut)}
                </text>
            )}
        </box>
    );
}
