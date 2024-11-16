class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.activeTheme = null;
        this.themeListeners = new Set();
        this.customProperties = new Map();
        this.initializeThemeSystem();
    }

    initializeThemeSystem() {
        this.createDefaultTheme();
        this.setupThemeDetection();
        this.initializeCustomProperties();
    }

    createDefaultTheme() {
        const defaultTheme = {
            name: 'default',
            colors: {
                primary: '#007bff',
                secondary: '#6c757d',
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8',
                light: '#f8f9fa',
                dark: '#343a40',
                background: '#ffffff',
                text: '#212529'
            },
            typography: {
                fontFamily: {
                    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                    heading: 'inherit',
                    monospace: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                },
                fontSize: {
                    base: '16px',
                    h1: '2.5rem',
                    h2: '2rem',
                    h3: '1.75rem',
                    h4: '1.5rem',
                    h5: '1.25rem',
                    h6: '1rem'
                },
                fontWeight: {
                    light: 300,
                    normal: 400,
                    medium: 500,
                    bold: 700
                },
                lineHeight: {
                    base: 1.5,
                    heading: 1.2,
                    tight: 1.25,
                    loose: 1.75
                }
            },
            spacing: {
                base: '1rem',
                xs: '0.25rem',
                sm: '0.5rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem'
            },
            borders: {
                width: {
                    default: '1px',
                    medium: '2px',
                    thick: '4px'
                },
                radius: {
                    sm: '0.25rem',
                    md: '0.5rem',
                    lg: '1rem',
                    full: '9999px'
                }
            },
            shadows: {
                sm: '0 1px 3px rgba(0,0,0,0.12)',
                md: '0 4px 6px rgba(0,0,0,0.1)',
                lg: '0 10px 15px rgba(0,0,0,0.1)',
                xl: '0 20px 25px rgba(0,0,0,0.1)'
            },
            breakpoints: {
                xs: '0px',
                sm: '576px',
                md: '768px',
                lg: '992px',
                xl: '1200px'
            },
            transitions: {
                default: 'all 0.3s ease',
                fast: 'all 0.15s ease',
                slow: 'all 0.45s ease'
            }
        };

        this.registerTheme('default', defaultTheme);
    }

    registerTheme(name, theme) {
        this.themes.set(name, theme);
    }

    async activateTheme(name) {
        const theme = this.themes.get(name);
        if (!theme) throw new Error(`Theme '${name}' not found`);

        this.activeTheme = name;
        await this.applyTheme(theme);
        this.notifyThemeListeners();
    }

    async applyTheme(theme) {
        // Convert theme to CSS variables
        const cssVariables = this.themeToCssVariables(theme);
        
        // Apply to root element
        const root = document.documentElement;
        Object.entries(cssVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Apply theme-specific styles
        this.applyThemeStyles(theme);
    }

    themeToCssVariables(theme, prefix = '--') {
        const variables = {};

        const processObject = (obj, path = '') => {
            Object.entries(obj).forEach(([key, value]) => {
                const newPath = path ? `${path}-${key}` : key;
                
                if (typeof value === 'object') {
                    processObject(value, newPath);
                } else {
                    variables[`${prefix}${newPath}`] = value;
                }
            });
        };

        processObject(theme);
        return variables;
    }

    applyThemeStyles(theme) {
        // Apply any theme-specific stylesheets or modifications
        const styleId = 'theme-specific-styles';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = this.generateThemeStyles(theme);
    }

    generateThemeStyles(theme) {
        // Generate theme-specific CSS
        return `
            body {
                font-family: var(--typography-fontFamily-base);
                font-size: var(--typography-fontSize-base);
                line-height: var(--typography-lineHeight-base);
                color: var(--colors-text);
                background-color: var(--colors-background);
            }

            h1, h2, h3, h4, h5, h6 {
                font-family: var(--typography-fontFamily-heading);
                line-height: var(--typography-lineHeight-heading);
            }

            // Add more theme-specific styles...
        `;
    }

    setupThemeDetection() {
        // Detect system theme preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleThemeChange = (e) => {
            const systemTheme = e.matches ? 'dark' : 'light';
            this.handleSystemThemeChange(systemTheme);
        };

        mediaQuery.addListener(handleThemeChange);
        handleThemeChange(mediaQuery);
    }

    handleSystemThemeChange(systemTheme) {
        // Handle system theme change if no theme is explicitly set
        if (!this.activeTheme && this.themes.has(systemTheme)) {
            this.activateTheme(systemTheme);
        }
    }

    addThemeListener(callback) {
        this.themeListeners.add(callback);
    }

    removeThemeListener(callback) {
        this.themeListeners.delete(callback);
    }

    notifyThemeListeners() {
        const theme = this.themes.get(this.activeTheme);
        this.themeListeners.forEach(callback => callback(theme));
    }

    getThemeValue(path) {
        const theme = this.themes.get(this.activeTheme);
        return path.split('.').reduce((obj, key) => obj?.[key], theme);
    }

    // Custom Properties Management
    initializeCustomProperties() {
        // Initialize any default custom properties
    }

    setCustomProperty(name, value) {
        this.customProperties.set(name, value);
        document.documentElement.style.setProperty(`--custom-${name}`, value);
    }

    getCustomProperty(name) {
        return this.customProperties.get(name);
    }

    removeCustomProperty(name) {
        this.customProperties.delete(name);
        document.documentElement.style.removeProperty(`--custom-${name}`);
    }
} 