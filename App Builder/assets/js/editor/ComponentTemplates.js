class ComponentTemplates {
    constructor() {
        this.templates = new Map();
        this.categories = new Set();
        this.initializeDefaultTemplates();
    }

    initializeDefaultTemplates() {
        // Layout Templates
        this.addTemplate('layout', 'header', {
            type: 'container',
            properties: {
                layout: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            children: [
                {
                    type: 'image',
                    properties: {
                        src: 'logo.png',
                        width: '120px',
                        height: 'auto'
                    }
                },
                {
                    type: 'navigation',
                    properties: {
                        items: [
                            { label: 'Home', link: '#' },
                            { label: 'About', link: '#' },
                            { label: 'Contact', link: '#' }
                        ]
                    }
                }
            ]
        });

        // Form Templates
        this.addTemplate('form', 'contact', {
            type: 'form',
            properties: {
                layout: 'vertical',
                gap: '1rem',
                padding: '2rem'
            },
            children: [
                {
                    type: 'input',
                    properties: {
                        label: 'Name',
                        placeholder: 'Enter your name',
                        required: true
                    }
                },
                {
                    type: 'input',
                    properties: {
                        label: 'Email',
                        type: 'email',
                        placeholder: 'Enter your email',
                        required: true
                    }
                },
                {
                    type: 'textarea',
                    properties: {
                        label: 'Message',
                        placeholder: 'Enter your message',
                        rows: 4
                    }
                },
                {
                    type: 'button',
                    properties: {
                        text: 'Submit',
                        style: 'primary',
                        width: '100%'
                    }
                }
            ]
        });

        // Card Templates
        this.addTemplate('card', 'product', {
            type: 'container',
            properties: {
                width: '300px',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            children: [
                {
                    type: 'image',
                    properties: {
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                    }
                },
                {
                    type: 'text',
                    properties: {
                        text: 'Product Title',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginTop: '1rem'
                    }
                },
                {
                    type: 'text',
                    properties: {
                        text: 'Product description goes here...',
                        color: '#666',
                        marginTop: '0.5rem'
                    }
                },
                {
                    type: 'button',
                    properties: {
                        text: 'Buy Now',
                        style: 'primary',
                        marginTop: '1rem'
                    }
                }
            ]
        });
    }

    addTemplate(category, name, template) {
        this.categories.add(category);
        this.templates.set(`${category}:${name}`, template);
    }

    getTemplate(category, name) {
        return this.templates.get(`${category}:${name}`);
    }

    getAllTemplates() {
        return Array.from(this.templates.entries()).map(([key, template]) => {
            const [category, name] = key.split(':');
            return { category, name, template };
        });
    }

    getTemplatesByCategory(category) {
        return Array.from(this.templates.entries())
            .filter(([key]) => key.startsWith(`${category}:`))
            .map(([key, template]) => {
                const name = key.split(':')[1];
                return { name, template };
            });
    }

    getCategories() {
        return Array.from(this.categories);
    }

    createComponentFromTemplate(category, name, customProperties = {}) {
        const template = this.getTemplate(category, name);
        if (!template) {
            throw new Error(`Template not found: ${category}:${name}`);
        }

        // Deep clone the template
        const component = JSON.parse(JSON.stringify(template));

        // Apply custom properties
        Object.assign(component.properties, customProperties);

        return component;
    }

    saveAsTemplate(component, category, name) {
        // Validate category and name
        if (!category || !name) {
            throw new Error('Category and name are required');
        }

        // Clean up component data before saving as template
        const template = this.cleanupComponentData(component);

        // Save template
        this.addTemplate(category, name, template);
    }

    cleanupComponentData(component) {
        // Remove instance-specific data
        const { id, position, ...cleanComponent } = component;
        return cleanComponent;
    }
} 