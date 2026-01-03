import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import {
    Children,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { COLORS, type KeyboardShortcut } from '../form/constants';
import { ActionItem } from './action-item';
import { ActionPanelContextProvider, type ActionPanelContextValue } from './action-panel-context';

const PANEL_WIDTH = 80;

export interface ActionProps {
    /** Action title */
    title: string;
    /** Icon to display */
    icon?: string;
    /** Keyboard shortcut */
    shortcut?: KeyboardShortcut;
    /** Action handler */
    onAction?: () => void;
    /** Submit handler */
    onSubmit?: () => void | Promise<void>;
    /** Target view to push */
    target?: ReactNode;
}

export function Action(_props: ActionProps) {
    return null;
}

interface ActionSubmitFormProps {
    /** Action title */
    title: string;
    /** Icon to display */
    icon?: string;
    /** Keyboard shortcut */
    shortcut?: KeyboardShortcut;
    /** Submit handler */
    onSubmit?: () => void | Promise<void>;
}

function ActionSubmitForm(_props: ActionSubmitFormProps) {
    return null;
}

interface ActionPushProps {
    /** Action title */
    title: string;
    /** Icon to display */
    icon?: string;
    /** Keyboard shortcut */
    shortcut?: KeyboardShortcut;
    /** Target view to push */
    target?: ReactNode;
}

function ActionPush(_props: ActionPushProps) {
    return null;
}

Action.SubmitForm = ActionSubmitForm;
Action.Push = ActionPush;

export interface ActionPanelSectionProps {
    /** Section title (optional) */
    title?: string;
    /** Action items */
    children?: ReactNode;
}

export function ActionPanelSection(_props: ActionPanelSectionProps) {
    return null;
}

export interface ActionPanelProps {
    /** Action sections and items */
    children?: ReactNode;
}

interface ParsedAction {
    title: string;
    icon?: string;
    shortcut?: KeyboardShortcut;
    onAction?: () => void | Promise<void>;
    sectionTitle?: string;
    type: 'action' | 'submit' | 'push';
    target?: ReactNode;
}

function parseActionChildren(children: ReactNode): ParsedAction[] {
    const actions: ParsedAction[] = [];

    const parseAction = (
        child: ReactElement<ActionProps>,
        sectionTitle?: string
    ): ParsedAction | null => {
        if (child.type === Action) {
            return {
                title: child.props.title,
                icon: child.props.icon,
                shortcut: child.props.shortcut,
                onAction: child.props.onAction,
                sectionTitle,
                type: 'action',
            };
        } else if (child.type === ActionSubmitForm) {
            return {
                title: child.props.title,
                icon: child.props.icon,
                shortcut: child.props.shortcut,
                onAction: child.props.onSubmit,
                sectionTitle,
                type: 'submit',
            };
        } else if (child.type === ActionPush) {
            return {
                title: child.props.title,
                icon: child.props.icon,
                shortcut: child.props.shortcut,
                sectionTitle,
                type: 'push',
                target: child.props.target,
            };
        }
        return null;
    };

    Children.forEach(children, child => {
        if (!isValidElement(child)) return;

        if (child.type === ActionPanelSection) {
            const sectionTitle = (child.props as ActionPanelSectionProps).title;
            Children.forEach((child.props as ActionPanelSectionProps).children, sectionChild => {
                if (isValidElement(sectionChild)) {
                    const action = parseAction(
                        sectionChild as ReactElement<ActionProps>,
                        sectionTitle
                    );
                    if (action) actions.push(action);
                }
            });
        } else {
            const action = parseAction(child as ReactElement<ActionProps>);
            if (action) actions.push(action);
        }
    });

    return actions;
}

function filterActions(actions: ParsedAction[], query: string): ParsedAction[] {
    if (!query.trim()) return actions;
    const lowerQuery = query.toLowerCase();
    return actions.filter(action => action.title.toLowerCase().includes(lowerQuery));
}

/**
 * ActionPanel component - declarative container for actions
 * This component is meant to be passed to Form's actions prop
 */
export function ActionPanel(_props: ActionPanelProps) {
    return null;
}

ActionPanel.Section = ActionPanelSection;

export interface ActionPanelOverlayProps {
    /** ActionPanel children */
    children?: ReactNode;
    /** Close handler */
    onClose: () => void;
    /** Form submit handler (for Action.SubmitForm) */
    onSubmit?: () => void | Promise<void>;
    /** Push navigation handler (for Action.Push) */
    onPush?: (target: ReactNode) => void;
}

export function ActionPanelOverlay({
    children,
    onClose,
    onSubmit,
    onPush,
}: ActionPanelOverlayProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const allActions = useMemo(() => {
        let actionPanelChildren: ReactNode = null;
        Children.forEach(children, child => {
            if (isValidElement(child) && child.type === ActionPanel) {
                actionPanelChildren = (child.props as ActionPanelProps).children;
            }
        });
        if (!actionPanelChildren) {
            actionPanelChildren = children;
        }
        return parseActionChildren(actionPanelChildren);
    }, [children]);

    const filteredActions = useMemo(
        () => filterActions(allActions, searchQuery),
        [allActions, searchQuery]
    );

    const executeAction = useCallback(
        async (index: number) => {
            const action = filteredActions[index];
            if (!action) return;

            if (action.type === 'submit' && onSubmit) {
                await onSubmit();
                onClose();
                return;
            }

            if (action.type === 'push' && action.target && onPush) {
                onPush(action.target);
                onClose();
                return;
            }

            if (action.onAction) {
                await action.onAction();
            }
            onClose();
        },
        [filteredActions, onClose, onSubmit, onPush]
    );

    useKeyboard(key => {
        if (key.name === 'escape') {
            onClose();
        } else if (key.name === 'up') {
            setSelectedIndex(i => (i - 1 + filteredActions.length) % filteredActions.length);
        } else if (key.name === 'down') {
            setSelectedIndex(i => (i + 1) % filteredActions.length);
        } else if (key.name === 'return') {
            executeAction(selectedIndex);
        } else {
            const matchingActionIndex = allActions.findIndex(action => {
                if (!action.shortcut) return false;

                const shortcut = action.shortcut;
                const modifiers = shortcut.modifiers || [];

                const ctrlMatch = modifiers.includes('ctrl') ? key.ctrl : !key.ctrl;
                const shiftMatch = modifiers.includes('shift') ? key.shift : !key.shift;
                const metaMatch = modifiers.includes('meta') ? key.meta : !key.meta;

                const keyMatch = key.name === shortcut.key;

                return ctrlMatch && shiftMatch && metaMatch && keyMatch;
            });

            if (matchingActionIndex !== -1) {
                executeAction(matchingActionIndex);
            }
        }
    });

    const contextValue: ActionPanelContextValue = useMemo(
        () => ({
            selectedIndex,
            setSelectedIndex,
            executeAction,
            close: onClose,
            searchQuery,
            setSearchQuery,
        }),
        [selectedIndex, executeAction, onClose, searchQuery]
    );

    const sections = useMemo(() => {
        const sectionMap = new Map<string | undefined, ParsedAction[]>();

        filteredActions.forEach(action => {
            const key = action.sectionTitle;
            if (!sectionMap.has(key)) {
                sectionMap.set(key, []);
            }
            const section = sectionMap.get(key);
            if (section) {
                section.push(action);
            }
        });

        return Array.from(sectionMap.entries()).map(([title, actions]) => ({
            title,
            actions,
        }));
    }, [filteredActions]);

    let flatIndex = 0;

    return (
        <ActionPanelContextProvider value={contextValue}>
            <box
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                justifyContent="center"
                alignItems="center"
            >
                <box
                    flexDirection="column"
                    padding={1}
                    borderStyle="rounded"
                    width={PANEL_WIDTH}
                    backgroundColor={COLORS.background}
                >
                    <box alignItems="flex-end" justifyContent="flex-end">
                        <text attributes={TextAttributes.DIM}>esc</text>
                    </box>

                    <box marginTop={1}>
                        <input
                            placeholder="Search actions..."
                            value={searchQuery}
                            focused={true}
                            onInput={(val: string) => {
                                setSearchQuery(val);
                                setSelectedIndex(0);
                            }}
                            textColor={COLORS.focused}
                            focusedTextColor={COLORS.focused}
                            backgroundColor="transparent"
                            focusedBackgroundColor="transparent"
                        />
                    </box>

                    <box flexDirection="column" marginTop={2}>
                        {sections.map((section, sectionIdx) => (
                            <box
                                key={section.title ?? `section-${sectionIdx}`}
                                flexDirection="column"
                            >
                                {section.title && (
                                    <box marginTop={sectionIdx > 0 ? 1 : 0}>
                                        <text fg={COLORS.focused}>{section.title}</text>
                                    </box>
                                )}

                                {section.actions.map(action => {
                                    const currentIndex = flatIndex++;
                                    const isSelected = currentIndex === selectedIndex;

                                    return (
                                        <ActionItem
                                            key={`${action.title}-${currentIndex}`}
                                            title={action.title}
                                            icon={action.icon}
                                            shortcut={action.shortcut}
                                            isSelected={isSelected}
                                            onMouseDown={() => executeAction(currentIndex)}
                                        />
                                    );
                                })}
                            </box>
                        ))}
                    </box>

                    <box flexDirection="row" marginTop={2} columnGap={4}>
                        <box flexDirection="row">
                            <text attributes={TextAttributes.BOLD}>↵</text>
                            <text attributes={TextAttributes.DIM}> select</text>
                        </box>
                        <box flexDirection="row">
                            <text attributes={TextAttributes.BOLD}>↑↓</text>
                            <text attributes={TextAttributes.DIM}> navigate</text>
                        </box>
                    </box>
                </box>
            </box>
        </ActionPanelContextProvider>
    );
}

export { ActionItem } from './action-item';
export type { ActionItemProps } from './action-item';
export type { ActionPanelContextValue } from './action-panel-context';
export type { ActionPushProps, ActionSubmitFormProps };
