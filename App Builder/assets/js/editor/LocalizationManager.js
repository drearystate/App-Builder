class LocalizationManager {
    constructor() {
        this.translations = new Map();
        this.fallbackLocale = 'en';
        this.currentLocale = 'en';
        this.loadingPromises = new Map();
        this.formatters = new Map();
        this.observers = new Set();
        this.initializeLocalization();
    }

    async initializeLocalization() {
        this.setupFormatters();
        await this.detectUserLocale();
        this.setupMutationObserver();
    }

    setupFormatters() {
        // Date formatter
        this.formatters.set('date', new Intl.DateTimeFormat(this.currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));

        // Number formatter
        this.formatters.set('number', new Intl.NumberFormat(this.currentLocale));

        // Currency formatter
        this.formatters.set('currency', new Intl.NumberFormat(this.currentLocale, {
            style: 'currency',
            currency: 'USD'
        }));

        // Relative time formatter
        this.formatters.set('relativeTime', new Intl.RelativeTimeFormat(this.currentLocale, {
            numeric: 'auto'
        }));
    }

    async detectUserLocale() {
        let locale = navigator.language;
        
        // Check if we have translations for this locale
        if (!await this.hasTranslations(locale)) {
            locale = this.fallbackLocale;
        }
        
        await this.setLocale(locale);
    }

    async setLocale(locale) {
        if (this.currentLocale === locale) return;

        try {
            await this.loadTranslations(locale);
            this.currentLocale = locale;
            this.updateFormatters();
            this.updateAllElements();
            this.notifyObservers();
        } catch (error) {
            console.error(`Failed to set locale to ${locale}:`, error);
            throw error;
        }
    }

    async loadTranslations(locale) {
        if (this.translations.has(locale)) return;

        if (!this.loadingPromises.has(locale)) {
            this.loadingPromises.set(locale, this.fetchTranslations(locale));
        }

        try {
            const translations = await this.loadingPromises.get(locale);
            this.translations.set(locale, translations);
        } finally {
            this.loadingPromises.delete(locale);
        }
    }

    async fetchTranslations(locale) {
        const response = await fetch(`/assets/locales/${locale}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${locale}`);
        }
        return response.json();
    }

    translate(key, params = {}) {
        const translation = this.getTranslation(key);
        if (!translation) return key;

        return this.interpolate(translation, params);
    }

    getTranslation(key) {
        const keys = key.split('.');
        let current = this.translations.get(this.currentLocale);

        for (const k of keys) {
            if (current === undefined) return null;
            current = current[k];
        }

        return current;
    }

    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            if (params.hasOwnProperty(key)) {
                const value = params[key];
                if (typeof value === 'object' && value.hasOwnProperty('_format')) {
                    return this.format(value.value, value._format);
                }
                return value;
            }
            return match;
        });
    }

    format(value, type) {
        const formatter = this.formatters.get(type);
        if (!formatter) return value;
        return formatter.format(value);
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.translateElement(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    translateElement(element) {
        // Translate attributes
        const translatableAttrs = element.querySelectorAll('[data-i18n]');
        translatableAttrs.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const params = this.getParamsFromElement(el);
            el.textContent = this.translate(key, params);
        });

        // Translate attributes
        const attrElements = element.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(el => {
            const attrs = el.getAttribute('data-i18n-attr').split(',');
            attrs.forEach(attr => {
                const [attrName, key] = attr.split(':');
                const params = this.getParamsFromElement(el);
                el.setAttribute(attrName, this.translate(key, params));
            });
        });
    }

    getParamsFromElement(element) {
        const params = element.getAttribute('data-i18n-params');
        return params ? JSON.parse(params) : {};
    }

    updateFormatters() {
        this.formatters.forEach((formatter, key) => {
            this.formatters.set(key, new formatter.constructor(this.currentLocale));
        });
    }

    updateAllElements() {
        this.translateElement(document.body);
    }

    addObserver(callback) {
        this.observers.add(callback);
    }

    removeObserver(callback) {
        this.observers.delete(callback);
    }

    notifyObservers() {
        this.observers.forEach(callback => {
            callback(this.currentLocale);
        });
    }

    async hasTranslations(locale) {
        try {
            await this.loadTranslations(locale);
            return true;
        } catch {
            return false;
        }
    }
} 