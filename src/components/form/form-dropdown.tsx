import React, { type ReactNode, useState, Children, isValidElement, useMemo } from 'react';
import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useFormContextSafe } from './form-context';
import { FormStep } from './form-step';
import { COLORS, ICONS, type DropdownOption, type DropdownSection } from './constants';

export interface FormDropdownItemProps {
    value: string;
    title: string;
}

export function FormDropdownItem(_props: FormDropdownItemProps) {
    return null;
}

export interface FormDropdownSectionProps {
    title?: string;
    children?: ReactNode;
}

export function FormDropdownSection(_props: FormDropdownSectionProps) {
    return null;
}

export interface FormDropdownProps {
    title: string;
    values?: string[];
    onChange?: (values: string[]) => void;
    maxVisibleItems?: number;
    children?: ReactNode;
    id?: string;
    error?: string;
    /** Override focus state (for standalone use outside Form) */
    isFocused?: boolean;
    _index?: number;
    _isFirst?: boolean;
    _isLast?: boolean;
}

function parseDropdownChildren(children: ReactNode): DropdownSection[] {
    const sections: DropdownSection[] = [];
    let currentSection: DropdownSection = { options: [] };

    Children.forEach(children, child => {
        if (!isValidElement(child)) return;

        if (child.type === FormDropdownSection) {
            if (currentSection.options.length > 0 || currentSection.title) {
                sections.push(currentSection);
            }
            const sectionProps = child.props as FormDropdownSectionProps;
            currentSection = {
                title: sectionProps.title,
                options: [],
            };
            Children.forEach(sectionProps.children, sectionChild => {
                if (isValidElement(sectionChild) && sectionChild.type === FormDropdownItem) {
                    const itemProps = sectionChild.props as FormDropdownItemProps;
                    currentSection.options.push({
                        value: itemProps.value,
                        title: itemProps.title,
                    });
                }
            });
        } else if (child.type === FormDropdownItem) {
            const itemProps = child.props as FormDropdownItemProps;
            currentSection.options.push({
                value: itemProps.value,
                title: itemProps.title,
            });
        }
    });

    if (currentSection.options.length > 0 || currentSection.title) {
        sections.push(currentSection);
    }

    return sections;
}

function flattenSections(sections: DropdownSection[]): {
    flatOptions: Array<DropdownOption & { sectionIndex: number; optionIndex: number }>;
    sectionStartIndices: number[];
} {
    const flatOptions: Array<DropdownOption & { sectionIndex: number; optionIndex: number }> = [];
    const sectionStartIndices: number[] = [];

    sections.forEach((section, sectionIndex) => {
        sectionStartIndices.push(flatOptions.length);
        section.options.forEach((option, optionIndex) => {
            flatOptions.push({ ...option, sectionIndex, optionIndex });
        });
    });

    return { flatOptions, sectionStartIndices };
}

function getVisibleWindow(
    totalItems: number,
    highlightedIndex: number,
    maxVisible: number
): { startIndex: number; endIndex: number } {
    if (totalItems <= maxVisible) {
        return { startIndex: 0, endIndex: totalItems };
    }

    const halfWindow = Math.floor(maxVisible / 2);
    let startIndex = highlightedIndex - halfWindow;
    let endIndex = startIndex + maxVisible;

    if (startIndex < 0) {
        startIndex = 0;
        endIndex = maxVisible;
    } else if (endIndex > totalItems) {
        endIndex = totalItems;
        startIndex = totalItems - maxVisible;
    }

    return { startIndex, endIndex };
}

export function FormDropdown({
    title,
    values = [],
    onChange,
    maxVisibleItems = 5,
    children,
    error,
    isFocused: isFocusedProp,
    _index = 0,
    _isFirst = false,
    _isLast = false,
}: FormDropdownProps) {
    const formContext = useFormContextSafe();
    // Use prop if provided, otherwise derive from form context, default to true for standalone
    const isFocused =
        isFocusedProp ?? (formContext ? formContext.focusedStepIndex === _index : true);
    const isStandalone = !title;

    const sections = useMemo(() => parseDropdownChildren(children), [children]);
    const { flatOptions } = useMemo(() => flattenSections(sections), [sections]);

    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const toggleSelection = (optionValue: string) => {
        const newValues = values.includes(optionValue)
            ? values.filter(v => v !== optionValue)
            : [...values, optionValue];
        onChange?.(newValues);
    };

    const removeSelection = (optionValue: string) => {
        onChange?.(values.filter(v => v !== optionValue));
    };

    useKeyboard(key => {
        if (!isFocused) return;

        if (key.name === 'up') {
            setHighlightedIndex(i => Math.max(0, i - 1));
        } else if (key.name === 'down') {
            setHighlightedIndex(i => Math.min(flatOptions.length - 1, i + 1));
        } else if (key.name === 'return' && !key.ctrl) {
            const option = flatOptions[highlightedIndex];
            if (option) {
                toggleSelection(option.value);
            }
        }
    });

    const { startIndex, endIndex } = getVisibleWindow(
        flatOptions.length,
        highlightedIndex,
        maxVisibleItems
    );

    const selectedOptions = flatOptions.filter(opt => values.includes(opt.value));

    const visibleItems: Array<{
        type: 'header' | 'option';
        content: string;
        optionIndex?: number;
        optionValue?: string;
    }> = [];
    let lastSectionIndex = -1;

    for (let i = startIndex; i < endIndex; i++) {
        const option = flatOptions[i];
        if (!option) continue;

        if (option.sectionIndex !== lastSectionIndex) {
            const section = sections[option.sectionIndex];
            if (section?.title) {
                visibleItems.push({ type: 'header', content: section.title });
            }
            lastSectionIndex = option.sectionIndex;
        }

        visibleItems.push({
            type: 'option',
            content: option.title,
            optionIndex: i,
            optionValue: option.value,
        });
    }

    const formStepChildren: React.ReactNode[] = [];

    selectedOptions.forEach(opt => {
        formStepChildren.push(
            // biome-ignore lint/a11y/noStaticElementInteractions: Terminal UI handles interaction separately
            <box
                key={`selected-${opt.value}`}
                flexDirection="row"
                onMouseDown={() => removeSelection(opt.value)}
            >
                <text fg={COLORS.focused}>{ICONS.removeIcon}</text>
                <text fg={COLORS.focused}> {opt.title}</text>
            </box>
        );
    });

    if (selectedOptions.length > 0) {
        formStepChildren.push(<text key="spacer"> </text>);
    }

    const scrollboxChildren: React.ReactNode[] = [];
    visibleItems.forEach((item, idx) => {
        if (item.type === 'header') {
            scrollboxChildren.push(
                <text key={`header-${idx.toString()}`} attributes={TextAttributes.DIM}>
                    {item.content}
                </text>
            );
        } else {
            const isHighlighted = isFocused && item.optionIndex === highlightedIndex;
            const isSelected = item.optionValue && values.includes(item.optionValue);
            const prefix = isHighlighted
                ? `${ICONS.optionArrow} ${isSelected ? ICONS.checkboxChecked : ICONS.checkboxEmpty}`
                : `  ${isSelected ? ICONS.checkboxChecked : ICONS.checkboxEmpty}`;

            scrollboxChildren.push(
                <text
                    key={`option-${item.optionIndex}`}
                    fg={
                        isSelected
                            ? COLORS.focused
                            : isHighlighted
                              ? COLORS.focused
                              : COLORS.unfocused
                    }
                >
                    {prefix} {item.content}
                </text>
            );
        }
    });

    formStepChildren.push(
        <scrollbox
            key="scrollbox"
            style={{
                scrollbarOptions: {
                    showArrows: false,
                },
                height: maxVisibleItems + 1,
            }}
            focused={isFocused}
        >
            {scrollboxChildren}
        </scrollbox>
    );

    if (error) {
        formStepChildren.push(
            <text key="error" fg="red" attributes={TextAttributes.DIM}>
                {error}
            </text>
        );
    }

    // Standalone mode: render without FormStep wrapper
    if (isStandalone) {
        return <box flexDirection="column">{formStepChildren}</box>;
    }

    return (
        <FormStep title={title} index={_index} isFirst={_isFirst} isLast={_isLast}>
            {formStepChildren}
        </FormStep>
    );
}

FormDropdown.Section = FormDropdownSection;
FormDropdown.Item = FormDropdownItem;
