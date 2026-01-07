import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/first-translation',
        'getting-started/understanding-the-interface',
      ],
    },
    {
      type: 'category',
      label: 'Workflows',
      items: [
        'workflows/basic-product-translation',
        'workflows/translating-attributes',
        'workflows/seo-meta-translation',
        'workflows/batch-processing',
        'workflows/handling-existing-translations',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'configuration/settings-overview',
        'configuration/gemini-api-setup',
        'configuration/model-selection',
        'configuration/output-directories',
      ],
    },
    {
      type: 'category',
      label: 'WPML Integration',
      items: [
        'wpml-integration/wpml-basics',
        'wpml-integration/exporting-from-woocommerce',
        'wpml-integration/importing-translations',
        'wpml-integration/translation-groups',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/common-errors',
        'troubleshooting/csv-format-issues',
        'troubleshooting/api-rate-limits',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: [
        'advanced/cost-optimization',
        'advanced/toon-format',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/keyboard-shortcuts',
        'reference/csv-schema',
      ],
    },
  ],
};

export default sidebars;
