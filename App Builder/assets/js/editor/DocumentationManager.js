class DocumentationManager {
    constructor() {
        this.docs = new Map();
        this.categories = new Set();
        this.examples = new Map();
        this.searchIndex = new Map();
    }

    addComponentDoc(componentId, documentation) {
        const doc = {
            ...documentation,
            id: componentId,
            timestamp: Date.now(),
            version: documentation.version || '1.0.0'
        };

        this.docs.set(componentId, doc);
        this.updateSearchIndex(componentId, doc);
        
        if (doc.category) {
            this.categories.add(doc.category);
        }
    }

    addExample(componentId, example) {
        if (!this.examples.has(componentId)) {
            this.examples.set(componentId, []);
        }
        this.examples.get(componentId).push({
            ...example,
            id: `example-${Date.now()}`,
            timestamp: Date.now()
        });
    }

    updateSearchIndex(componentId, doc) {
        const searchableText = [
            doc.name,
            doc.description,
            doc.category,
            ...(doc.tags || []),
            ...(doc.properties?.map(prop => `${prop.name} ${prop.description}`) || [])
        ].join(' ').toLowerCase();

        this.searchIndex.set(componentId, searchableText);
    }

    generateDocumentation(componentId) {
        const doc = this.docs.get(componentId);
        if (!doc) return null;

        return {
            ...doc,
            examples: this.examples.get(componentId) || [],
            html: this.generateHTML(doc),
            markdown: this.generateMarkdown(doc)
        };
    }

    generateHTML(doc) {
        return `
            <div class="component-documentation">
                <h1>${doc.name}</h1>
                <p class="description">${doc.description}</p>
                
                ${this.generatePropertiesHTML(doc.properties)}
                ${this.generateEventsHTML(doc.events)}
                ${this.generateExamplesHTML(doc.id)}
            </div>
        `;
    }

    generateMarkdown(doc) {
        return `
# ${doc.name}

${doc.description}

## Properties

${this.generatePropertiesMarkdown(doc.properties)}

## Events

${this.generateEventsMarkdown(doc.events)}

## Examples

${this.generateExamplesMarkdown(doc.id)}
        `;
    }

    generatePropertiesHTML(properties = []) {
        if (!properties.length) return '';

        return `
            <h2>Properties</h2>
            <table class="properties-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Default</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${properties.map(prop => `
                        <tr>
                            <td>${prop.name}</td>
                            <td><code>${prop.type}</code></td>
                            <td>${prop.default !== undefined ? `<code>${prop.default}</code>` : '-'}</td>
                            <td>${prop.description}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateEventsHTML(events = []) {
        if (!events.length) return '';

        return `
            <h2>Events</h2>
            <table class="events-table">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Description</th>
                        <th>Parameters</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(event => `
                        <tr>
                            <td>${event.name}</td>
                            <td>${event.description}</td>
                            <td>
                                ${event.parameters?.map(param => `
                                    <code>${param.name}: ${param.type}</code>
                                `).join(', ') || '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateExamplesHTML(componentId) {
        const examples = this.examples.get(componentId) || [];
        if (!examples.length) return '';

        return `
            <h2>Examples</h2>
            ${examples.map(example => `
                <div class="example">
                    <h3>${example.name}</h3>
                    <p>${example.description}</p>
                    <div class="code-example">
                        <pre><code>${example.code}</code></pre>
                    </div>
                    ${example.preview ? `
                        <div class="example-preview">
                            ${example.preview}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        `;
    }

    search(query) {
        const searchTerms = query.toLowerCase().split(' ');
        const results = new Map();

        for (const [componentId, searchText] of this.searchIndex) {
            const matchScore = searchTerms.reduce((score, term) => {
                return score + (searchText.includes(term) ? 1 : 0);
            }, 0);

            if (matchScore > 0) {
                results.set(componentId, {
                    score: matchScore,
                    doc: this.docs.get(componentId)
                });
            }
        }

        return Array.from(results.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .map(([_, { doc }]) => doc);
    }

    exportDocumentation(format = 'html') {
        const docs = Array.from(this.docs.values());
        
        switch (format) {
            case 'html':
                return this.exportHTML(docs);
            case 'markdown':
                return this.exportMarkdown(docs);
            case 'json':
                return this.exportJSON(docs);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    exportHTML(docs) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Component Documentation</title>
                <style>
                    ${this.getDocumentationStyles()}
                </style>
            </head>
            <body>
                <div class="documentation">
                    ${docs.map(doc => this.generateHTML(doc)).join('\n')}
                </div>
            </body>
            </html>
        `;
    }

    exportMarkdown(docs) {
        return docs.map(doc => this.generateMarkdown(doc)).join('\n\n---\n\n');
    }

    exportJSON(docs) {
        return JSON.stringify(docs, null, 2);
    }

    getDocumentationStyles() {
        return `
            .component-documentation {
                margin: 2rem 0;
                padding: 1rem;
                border: 1px solid #eee;
            }
            
            .properties-table, .events-table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
            }
            
            .properties-table th, .properties-table td,
            .events-table th, .events-table td {
                padding: 0.5rem;
                border: 1px solid #eee;
                text-align: left;
            }
            
            .code-example {
                background: #f5f5f5;
                padding: 1rem;
                border-radius: 4px;
                margin: 1rem 0;
            }
            
            .example-preview {
                border: 1px solid #eee;
                padding: 1rem;
                margin: 1rem 0;
            }
        `;
    }
} 