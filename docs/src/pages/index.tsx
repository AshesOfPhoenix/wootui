import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

import styles from './index.module.css';

function DemoSection() {
    return (
        <section className={styles.demoSection}>
            <div className="container">
                <div className={styles.demoContent}>
                    <Heading as="h2" className={styles.demoHeading}>
                        WooTUI
                    </Heading>
                    <p className={styles.demoDescription}>
                        A powerful terminal interface designed for translating WooCommerce products.
                        Navigate through the intuitive wizard, preview costs, and export
                        multilingual catalogs—all from your terminal.
                    </p>
                    <div className={styles.buttons}>
                        <Link className="button button--secondary button--lg" to="/docs/intro">
                            Get Started
                        </Link>
                    </div>
                    <div className={styles.demoImageWrapper}>
                        <img
                            src="/wootui/img/wootui-demo.png"
                            alt="WooTUI Application Demo - Terminal interface showing translation workflow"
                            className={styles.demoImage}
                        />
                        <div className={styles.demoCaption}>
                            WooTUI's 6-step wizard guides you from CSV import to translated output
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    const features = [
        {
            id: 'ai-translation',
            icon: '🤖',
            title: 'AI-Powered Translation',
            description: 'Uses Google Gemini for accurate, context-aware translations',
        },
        {
            id: 'multi-language',
            icon: '🌍',
            title: 'Multi-Language Support',
            description: 'Translate to any target language with ease',
        },
        {
            id: 'cost-transparency',
            icon: '💰',
            title: 'Cost Transparency',
            description: 'See token usage and pricing estimates before translating',
        },
        {
            id: 'csv-compatible',
            icon: '📦',
            title: 'WooCommerce CSV Compatible',
            description: 'Works directly with WooCommerce product exports',
        },
        {
            id: 'column-selection',
            icon: '✅',
            title: 'Column Selection',
            description: 'Choose which columns to translate for maximum control',
        },
        {
            id: 'terminal-ui',
            icon: '⌨️',
            title: 'Terminal UI',
            description: 'Fast, efficient interface built with OpenTUI',
        },
    ];

    return (
        <section className={styles.featuresSection}>
            <div className="container">
                <Heading as="h2" className="text--center">
                    Features
                </Heading>
                <div className={styles.featuresGrid}>
                    {features.map(feature => (
                        <div key={feature.id} className={styles.featureCard}>
                            <div className={styles.featureIcon}>{feature.icon}</div>
                            <div className={styles.featureTitle}>{feature.title}</div>
                            <div className={styles.featureDescription}>{feature.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function InstallationSection() {
    return (
        <section className={styles.installationSection}>
            <div className="container">
                <Heading as="h2" className="text--center">
                    Installation
                </Heading>

                <div className={styles.prerequisiteNote}>
                    <strong>Prerequisites:</strong> You'll need a{' '}
                    <a
                        href="https://ai.google.dev/gemini-api/docs/api-key"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google Gemini API key
                    </a>{' '}
                    to use WooTUI.
                </div>

                <div className={styles.installCommand}>
                    <Heading as="h3">Mac OS</Heading>
                    <CodeBlock language="bash">
                        curl -sf https://ashesofphoenix.github.io/wootui/install | bash
                    </CodeBlock>
                </div>

                <div className={styles.installCommand}>
                    <Heading as="h3">Windows</Heading>
                    <CodeBlock language="powershell">
                        irm https://ashesofphoenix.github.io/wootui/install.ps1 | iex
                    </CodeBlock>
                </div>
            </div>
        </section>
    );
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={siteConfig.title}
            description="Translate WooCommerce products to any language using AI"
        >
            <main>
                <DemoSection />
                <FeaturesSection />
                <InstallationSection />
            </main>
        </Layout>
    );
}
