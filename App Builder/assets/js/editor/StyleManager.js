class StyleManager {
    constructor() {
        this.styles = new Map();
        this.themes = new Map();
        this.currentTheme = null;
        this.styleSheet = this.createStyleSheet();
        this.initializeDefaultTheme();
    }

    createStyleSheet() {
        const style = document.createElement('style');
        document.head.appendChild(style);
        return style.sheet;
    }

    initializeDefaultTheme() {
        this.addTheme('default', {
            colors: {
                primary: '#007bff',
                secondary: '#6c757d',
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8',
                light: '#f8f9fa',
                dark: '#343a40'
            },
            typography: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                fontSize: {
                    base: '16px',
                    small: '14px',
                    large: '18px',
                    h1: '2.5rem',
                    h2: '2rem',
                    h3: '1.75rem',
                    h4: '1.5rem'
                },
                fontWeight: {
                    normal: 400,
                    medium: 500,
                    bold: 700
                },
                lineHeight: 1.5
            },
            spacing: {
                unit: '8px',
                small: '0.5rem',
                medium: '1rem',
                large: '1.5rem',
                xlarge: '2rem'
            },
            borders: {
                radius: {
                    small: '0.25rem',
                    medium: '0.5rem',
                    large: '1rem',
                    circle: '50%'
                },
                width: {
                    thin: '1px',
                    medium: '2px',
                    thick: '4px'
                }
            },
            shadows: {
                small: '0 2px 4px rgba(0,0,0,0.1)',
                medium: '0 4px 6px rgba(0,0,0,0.1)',
                large: '0 8px 16px rgba(0,0,0,0.1)'
            },
            transitions: {
                quick: 'all 0.2s ease',
                medium: 'all 0.3s ease',
                slow: 'all 0.5s ease'
            }
        });

        this.setTheme('default');
    }

    addTheme(name, theme) {
        this.themes.set(name, theme);
    }

    setTheme(name) {
        const theme = this.themes.get(name);
        if (!theme) throw new Error(`Theme '${name}' not found`);
        
        this.currentTheme = name;
        this.updateThemeStyles(theme);
    }

    updateThemeStyles(theme) {
        // Clear existing theme styles
        while (this.styleSheet.cssRules.length > 0) {
            this.styleSheet.deleteRule(0);
        }

        // Add CSS variables
        this.addCSSVariables(theme);

        // Add component styles
        this.styles.forEach((style, selector) => {
            this.addStyle(selector, style);
        });
    }

    addCSSVariables(theme) {
        const variables = this.flattenTheme(theme);
        let cssVars = ':root {';
        
        Object.entries(variables).forEach(([key, value]) => {
            cssVars += `--${key}: ${value};`;
        });
        
        cssVars += '}';
        this.styleSheet.insertRule(cssVars, 0);
    }

    flattenTheme(theme, prefix = '') {
        const result = {};
        
        Object.entries(theme).forEach(([key, value]) => {
            const newPrefix = prefix ? `${prefix}-${key}` : key;
            
            if (typeof value === 'object' && value !== null) {
                Object.assign(result, this.flattenTheme(value, newPrefix));
            } else {
                result[newPrefix] = value;
            }
        });
        
        return result;
    }

    addStyle(selector, styles) {
        this.styles.set(selector, styles);
        this.updateStyle(selector, styles);
    }

    updateStyle(selector, styles) {
        const cssText = this.generateCSSText(styles);
        const ruleText = `${selector} { ${cssText} }`;
        
        // Find existing rule or add new one
        let ruleIndex = this.findRuleIndex(selector);
        if (ruleIndex !== -1) {
            this.styleSheet.deleteRule(ruleIndex);
        }
        this.styleSheet.insertRule(ruleText, this.styleSheet.cssRules.length);
    }

    generateCSSText(styles) {
        return Object.entries(styles).map(([property, value]) => {
            const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssProperty}: ${this.processStyleValue(value)};`;
        }).join(' ');
    }

    processStyleValue(value) {
        if (value.startsWith('var(')) return value;
        if (value.startsWith('theme.')) {
            const path = value.split('.').slice(1);
            return `var(--${path.join('-')})`;
        }
        return value;
    }

    findRuleIndex(selector) {
        for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
            if (this.styleSheet.cssRules[i].selectorText === selector) {
                return i;
            }
        }
        return -1;
    }

    // Component-specific styling
    addComponentStyle(componentId, styles) {
        this.addStyle(`[data-component-id="${componentId}"]`, styles);
    }

    removeComponentStyle(componentId) {
        const selector = `[data-component-id="${componentId}"]`;
        this.styles.delete(selector);
        
        const ruleIndex = this.findRuleIndex(selector);
        if (ruleIndex !== -1) {
            this.styleSheet.deleteRule(ruleIndex);
        }
    }

    // State-based styling
    addStateStyle(componentId, state, styles) {
        const selector = `[data-component-id="${componentId}"].${state}`;
        this.addStyle(selector, styles);
    }

    // Media queries
    addMediaQuery(query, styles) {
        const mediaRule = `@media ${query}`;
        Object.entries(styles).forEach(([selector, style]) => {
            const fullSelector = `${mediaRule} { ${selector} { ${this.generateCSSText(style)} } }`;
            this.styleSheet.insertRule(fullSelector, this.styleSheet.cssRules.length);
        });
    }
} 