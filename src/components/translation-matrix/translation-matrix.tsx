import { TextAttributes } from '@opentui/core';
import { useMemo } from 'react';
import type { LanguageCode } from '../../types/language-code';
import { type WooCsvParseSummary, WpmlImportColumns } from '../../utils/woo-csv';
import { COLORS } from '../form/constants';
import { languageMap } from '../../utils/language-map';

export interface TranslationMatrixProps {
    parseSummary: WooCsvParseSummary;
    targetLanguages: LanguageCode[];
    overrideLanguages: LanguageCode[];
}

export function TranslationMatrix({
    parseSummary,
    targetLanguages,
    overrideLanguages,
}: TranslationMatrixProps) {
    const sourceLanguages = useMemo(() => {
        const languages = new Set<string>();
        // Using WpmlImportColumns.ImportLanguageCode which is 'Meta: _wpml_import_language_code'
        // This marks the language of the product row.
        parseSummary.productSourceTranslations.forEach(product => {
            const lang = product[WpmlImportColumns.ImportLanguageCode];
            if (lang) {
                languages.add(lang as string);
            }
        });
        return Array.from(languages);
    }, [parseSummary.productSourceTranslations]);

    // Pre-calculate existing translations for faster lookup
    // Map: TranslationGroup -> Set<LanguageCode>
    const existingTranslationsMap = useMemo(() => {
        const map = new Map<string, Set<string>>();

        parseSummary.productExistingTranslations.forEach(product => {
            const group = product[WpmlImportColumns.TranslationGroup];
            const lang = product[WpmlImportColumns.ImportLanguageCode];

            if (group && lang) {
                let set = map.get(group);
                if (!set) {
                    set = new Set();
                    map.set(group, set);
                }
                set.add(lang as string);
            }
        });

        return map;
    }, [parseSummary.productExistingTranslations]);

    // Cell calculation
    // Returns: count or "missing" count
    const getCellContent = (sourceLang: string, targetLang: LanguageCode) => {
        const isOverride = overrideLanguages.includes(targetLang);

        // Filter source products by this source language
        const productsOfSourceLang = parseSummary.productSourceTranslations.filter(
            p => p[WpmlImportColumns.ImportLanguageCode] === sourceLang
        );

        if (isOverride) {
            return productsOfSourceLang.length;
        }

        // Count how many are MISSING translation in targetLang
        let missingCount = 0;

        productsOfSourceLang.forEach(product => {
            const group = product[WpmlImportColumns.TranslationGroup];
            // If group is missing, we assume it's a new product or untracked
            if (!group) {
                missingCount++;
                return;
            }

            const translations = existingTranslationsMap.get(group);
            if (!translations || !translations.has(targetLang)) {
                missingCount++;
            }
        });

        return missingCount;
    };

    if (targetLanguages.length === 0) {
        return null;
    }

    const COL_WIDTH = 12;
    const SOURCE_COL_WIDTH = 12;

    return (
        <box>
            <scrollbox
                flexDirection="row"
                scrollX={true}
                scrollY={false}
                horizontalScrollbarOptions={{ showArrows: false }}
                marginTop={1}
                height={7}
            >
                <box flexDirection="column">
                    {/* Header Row */}
                    <box flexDirection="row">
                        <box
                            width={SOURCE_COL_WIDTH}
                            border={['top', 'left', 'right']}
                            borderColor="#aaaaaa"
                            borderStyle="double"
                        >
                            <text attributes={TextAttributes.DIM}>Source</text>
                        </box>
                        {targetLanguages.map((lang, index) => (
                            <box
                                key={lang}
                                width={COL_WIDTH}
                                justifyContent="center"
                                alignItems="center"
                                border={['top', 'right', 'left']}
                                borderColor="#aaaaaa"
                                borderStyle="single"
                            >
                                <text attributes={TextAttributes.BOLD}>{languageMap[lang]}</text>
                            </box>
                        ))}
                    </box>
                    {/* Rows */}
                    {sourceLanguages.map(sourceLang => (
                        <box key={sourceLang} flexDirection="row">
                            <box
                                width={SOURCE_COL_WIDTH}
                                border={['bottom', 'left', 'right']}
                                borderColor="#aaaaaa"
                                borderStyle="double"
                            >
                                <text>
                                    {languageMap[sourceLang as LanguageCode] ??
                                        sourceLang.toUpperCase()}
                                </text>
                            </box>
                            {targetLanguages.map((targetLang, index) => {
                                const count = getCellContent(sourceLang, targetLang);
                                const isOverride = overrideLanguages.includes(targetLang);
                                // If count is 0 and not override, dim it
                                const isDim = count === 0 && !isOverride;
                                let color = undefined;
                                if (isOverride) {
                                    color = COLORS.focused; // Gold/Yellow for override
                                } else if (count > 0) {
                                    color = undefined; // Default white
                                } else {
                                    color = '#666'; // Dim
                                }
                                return (
                                    <box
                                        key={`${sourceLang}-${targetLang}`}
                                        width={COL_WIDTH}
                                        justifyContent="center"
                                        alignItems="center"
                                        border={['bottom', 'right', 'left']}
                                        borderColor="#aaaaaa"
                                        borderStyle="single"
                                    >
                                        <text
                                            fg={color}
                                            attributes={isDim ? TextAttributes.DIM : undefined}
                                        >
                                            {String(count)}
                                        </text>
                                    </box>
                                );
                            })}
                        </box>
                    ))}
                </box>
            </scrollbox>
        </box>
    );
}
