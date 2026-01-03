import { TextAttributes } from '@opentui/core';
import { useFormContext } from './form-context';
import { FormStep } from './form-step';
import { COLORS } from './constants';

export interface FormTextFieldProps {
    /** Title of the field */
    title: string;
    /** Placeholder text when empty */
    placeholder?: string;
    /** Current value */
    value?: string;
    /** Change handler */
    onChange?: (value: string) => void;
    /** Description text */
    description?: string;
    /** Auto focus this field on mount */
    autoFocus?: boolean;
    /** Field ID for form integration */
    id?: string;
    /** Validation error message */
    error?: string;
    /** Internal: step index (set by Form) */
    _index?: number;
    /** Internal: whether this is the first step */
    _isFirst?: boolean;
    /** Internal: whether this is the last step */
    _isLast?: boolean;
}

export function FormTextField({
    title,
    placeholder,
    value = '',
    description,
    onChange,
    error,
    _index = 0,
    _isFirst = false,
    _isLast = false,
}: FormTextFieldProps) {
    const { focusedStepIndex } = useFormContext();
    const isFocused = focusedStepIndex === _index;

    return (
        <FormStep title={title} index={_index} isFirst={_isFirst} isLast={_isLast}>
            <input
                placeholder={placeholder}
                value={value}
                focused={isFocused}
                onInput={(val: string) => onChange?.(val)}
                onChange={(val: string) => onChange?.(val)}
                onPaste={(event: { text: string }) => {
                    onChange?.(value + event.text);
                }}
                textColor={COLORS.unfocused}
                backgroundColor="transparent"
                focusedBackgroundColor="transparent"
                focusedTextColor={COLORS.unfocused}
            />

            {description && (
                <>
                    <text key="spacer"> </text>
                    <box marginTop={1}>
                        <text attributes={TextAttributes.DIM}>{description}</text>
                    </box>
                </>
            )}

            {error && (
                <text fg="red" attributes={TextAttributes.DIM}>
                    {error}
                </text>
            )}
        </FormStep>
    );
}
