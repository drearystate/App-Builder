class FormManager {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.formatters = new Map();
        this.masks = new Map();
        this.submissions = new Map();
        this.state = new Map();
        this.validationCache = new Map();
        this.persistFormState = debounce(async (formId, state) => {
            try {
                await localStorage.setItem(`form_${formId}`, JSON.stringify(state));
            } catch (error) {
                console.error('Form state persistence failed:', error);
            }
        }, 1000);
        this.cleanupForm = (formId) => {
            this.validationCache.delete(formId);
            localStorage.removeItem(`form_${formId}`);
            // Additional cleanup...
        };
        this.initializeFormManager();
    }

    initializeFormManager() {
        this.setupDefaultValidators();
        this.setupDefaultFormatters();
        this.setupDefaultMasks();
        this.setupFormObserver();
        this.setupEventHandlers();
    }

    setupDefaultValidators() {
        // Required field validator
        this.registerValidator('required', (value) => ({
            valid: value !== null && value !== undefined && value.toString().trim() !== '',
            message: 'This field is required'
        }));

        // Email validator
        this.registerValidator('email', (value) => ({
            valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email address'
        }));

        // Number validator
        this.registerValidator('number', (value) => ({
            valid: !isNaN(value) && isFinite(value),
            message: 'Please enter a valid number'
        }));

        // Min length validator
        this.registerValidator('minLength', (value, length) => ({
            valid: value.length >= length,
            message: `Minimum length is ${length} characters`
        }));

        // Max length validator
        this.registerValidator('maxLength', (value, length) => ({
            valid: value.length <= length,
            message: `Maximum length is ${length} characters`
        }));

        // Pattern validator
        this.registerValidator('pattern', (value, pattern) => ({
            valid: new RegExp(pattern).test(value),
            message: 'Please match the requested format'
        }));

        // Custom async validator
        this.registerValidator('async', async (value, validationFn) => {
            try {
                const result = await validationFn(value);
                return {
                    valid: result.valid,
                    message: result.message
                };
            } catch (error) {
                return {
                    valid: false,
                    message: 'Validation failed'
                };
            }
        });
    }

    setupDefaultFormatters() {
        // Phone number formatter
        this.registerFormatter('phone', (value) => {
            const cleaned = value.replace(/\D/g, '');
            const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
            return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
        });

        // Currency formatter
        this.registerFormatter('currency', (value) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(value);
        });

        // Date formatter
        this.registerFormatter('date', (value) => {
            return new Date(value).toLocaleDateString();
        });

        // Number formatter
        this.registerFormatter('number', (value) => {
            return new Intl.NumberFormat().format(value);
        });
    }

    setupDefaultMasks() {
        // Phone mask
        this.registerMask('phone', {
            mask: '(000) 000-0000',
            placeholder: '_'
        });

        // Date mask
        this.registerMask('date', {
            mask: '00/00/0000',
            placeholder: '_'
        });

        // Credit card mask
        this.registerMask('creditCard', {
            mask: '0000 0000 0000 0000',
            placeholder: '_'
        });

        // Time mask
        this.registerMask('time', {
            mask: '00:00',
            placeholder: '_'
        });
    }

    setupFormObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'FORM') {
                        this.autoRegisterForm(node);
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.nodeName === 'FORM') {
                        this.unregisterForm(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupEventHandlers() {
        document.addEventListener('input', (event) => {
            const form = event.target.closest('form');
            if (form && this.forms.has(form)) {
                this.handleFieldChange(form, event.target);
            }
        });

        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (this.forms.has(form)) {
                event.preventDefault();
                this.handleSubmit(form);
            }
        });
    }

    registerForm(form, config = {}) {
        const formId = this.generateFormId();
        
        this.forms.set(form, {
            id: formId,
            config: {
                validateOnChange: config.validateOnChange ?? true,
                validateOnBlur: config.validateOnBlur ?? true,
                validateOnSubmit: config.validateOnSubmit ?? true,
                ...config
            },
            fields: new Map(),
            state: {
                dirty: false,
                touched: false,
                valid: true,
                submitting: false,
                submitted: false
            }
        });

        this.setupFormFields(form);
        this.initializeFormState(form);
        return formId;
    }

    setupFormFields(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            this.registerField(form, field);
        });
    }

    registerField(form, field) {
        const formData = this.forms.get(form);
        if (!formData) return;

        const fieldConfig = {
            validators: this.parseValidators(field),
            formatters: this.parseFormatters(field),
            mask: this.parseMask(field),
            defaultValue: field.value,
            state: {
                value: field.value,
                dirty: false,
                touched: false,
                valid: true,
                errors: []
            }
        };

        formData.fields.set(field, fieldConfig);
        this.setupFieldEventListeners(form, field);
    }

    parseValidators(field) {
        const validators = [];
        
        if (field.required) {
            validators.push(['required']);
        }

        if (field.type === 'email') {
            validators.push(['email']);
        }

        if (field.minLength) {
            validators.push(['minLength', field.minLength]);
        }

        if (field.maxLength) {
            validators.push(['maxLength', field.maxLength]);
        }

        if (field.pattern) {
            validators.push(['pattern', field.pattern]);
        }

        // Parse custom validators from data attributes
        const customValidators = field.dataset.validators;
        if (customValidators) {
            try {
                const parsed = JSON.parse(customValidators);
                validators.push(...parsed);
            } catch (error) {
                console.error('Error parsing custom validators:', error);
            }
        }

        return validators;
    }

    parseFormatters(field) {
        const formatters = [];
        
        // Parse formatters from data attributes
        const customFormatters = field.dataset.formatters;
        if (customFormatters) {
            try {
                const parsed = JSON.parse(customFormatters);
                formatters.push(...parsed);
            } catch (error) {
                console.error('Error parsing custom formatters:', error);
            }
        }

        return formatters;
    }

    parseMask(field) {
        const maskType = field.dataset.mask;
        return maskType ? this.masks.get(maskType) : null;
    }

    setupFieldEventListeners(form, field) {
        const formData = this.forms.get(form);
        if (!formData) return;

        field.addEventListener('blur', () => {
            const fieldData = formData.fields.get(field);
            if (fieldData) {
                fieldData.state.touched = true;
                if (formData.config.validateOnBlur) {
                    this.validateField(form, field);
                }
            }
        });

        field.addEventListener('input', () => {
            const fieldData = formData.fields.get(field);
            if (fieldData) {
                fieldData.state.dirty = true;
                this.updateFieldValue(form, field, field.value);
            }
        });
    }

    async validateField(form, field) {
        const formData = this.forms.get(form);
        const fieldData = formData.fields.get(field);
        if (!formData || !fieldData) return;

        const errors = [];
        const value = field.value;

        for (const [validatorName, ...args] of fieldData.validators) {
            const validator = this.validators.get(validatorName);
            if (validator) {
                try {
                    const result = await validator(value, ...args);
                    if (!result.valid) {
                        errors.push(result.message);
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                    errors.push('Validation failed');
                }
            }
        }

        fieldData.state.valid = errors.length === 0;
        fieldData.state.errors = errors;

        this.updateFieldUI(form, field);
        this.updateFormValidity(form);

        return fieldData.state.valid;
    }

    updateFieldValue(form, field, value) {
        const formData = this.forms.get(form);
        const fieldData = formData.fields.get(field);
        if (!formData || !fieldData) return;

        // Apply formatters
        let formattedValue = value;
        for (const formatterName of fieldData.formatters) {
            const formatter = this.formatters.get(formatterName);
            if (formatter) {
                formattedValue = formatter(formattedValue);
            }
        }

        // Apply mask
        if (fieldData.mask) {
            formattedValue = this.applyMask(formattedValue, fieldData.mask);
        }

        field.value = formattedValue;
        fieldData.state.value = formattedValue;

        if (formData.config.validateOnChange) {
            this.validateField(form, field);
        }

        this.updateFormState(form);
    }

    applyMask(value, maskConfig) {
        const { mask, placeholder } = maskConfig;
        let result = '';
        let valueIndex = 0;

        for (let i = 0; i < mask.length; i++) {
            if (valueIndex >= value.length) {
                result += placeholder;
                continue;
            }

            if (mask[i] === '0') {
                if (/\d/.test(value[valueIndex])) {
                    result += value[valueIndex];
                    valueIndex++;
                } else {
                    result += placeholder;
                }
            } else {
                result += mask[i];
            }
        }

        return result;
    }

    updateFieldUI(form, field) {
        const formData = this.forms.get(form);
        const fieldData = formData.fields.get(field);
        if (!formData || !fieldData) return;

        // Update field classes
        field.classList.toggle('is-valid', fieldData.state.valid);
        field.classList.toggle('is-invalid', !fieldData.state.valid);
        field.classList.toggle('is-touched', fieldData.state.touched);
        field.classList.toggle('is-dirty', fieldData.state.dirty);

        // Update error messages
        let errorContainer = field.nextElementSibling;
        if (!errorContainer || !errorContainer.classList.contains('field-errors')) {
            errorContainer = document.createElement('div');
            errorContainer.classList.add('field-errors');
            field.parentNode.insertBefore(errorContainer, field.nextSibling);
        }

        errorContainer.innerHTML = fieldData.state.errors
            .map(error => `<div class="field-error">${error}</div>`)
            .join('');
    }

    updateFormState(form) {
        const formData = this.forms.get(form);
        if (!formData) return;

        formData.state.dirty = Array.from(formData.fields.values())
            .some(field => field.state.dirty);

        formData.state.touched = Array.from(formData.fields.values())
            .some(field => field.state.touched);

        this.updateFormUI(form);
    }

    updateFormValidity(form) {
        const formData = this.forms.get(form);
        if (!formData) return;

        formData.state.valid = Array.from(formData.fields.values())
            .every(field => field.state.valid);

        this.updateFormUI(form);
    }

    updateFormUI(form) {
        const formData = this.forms.get(form);
        if (!formData) return;

        // Update form classes
        form.classList.toggle('is-valid', formData.state.valid);
        form.classList.toggle('is-invalid', !formData.state.valid);
        form.classList.toggle('is-touched', formData.state.touched);
        form.classList.toggle('is-dirty', formData.state.dirty);
        form.classList.toggle('is-submitting', formData.state.submitting);
        form.classList.toggle('is-submitted', formData.state.submitted);
    }

    async handleSubmit(form) {
        const formData = this.forms.get(form);
        if (!formData) return;

        formData.state.submitting = true;
        this.updateFormUI(form);

        try {
            // Validate all fields
            const validations = Array.from(formData.fields.entries())
                .map(([field]) => this.validateField(form, field));
            
            await Promise.all(validations);

            if (formData.state.valid) {
                const values = this.getFormValues(form);
                
                if (formData.config.onSubmit) {
                    await formData.config.onSubmit(values);
                }

                formData.state.submitted = true;
                this.submissions.set(formData.id, {
                    timestamp: Date.now(),
                    values
                });

                if (formData.config.resetOnSubmit) {
                    this.resetForm(form);
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            if (formData.config.onError) {
                formData.config.onError(error);
            }
        } finally {
            formData.state.submitting = false;
            this.updateFormUI(form);
        }
    }

    getFormValues(form) {
        const formData = this.forms.get(form);
        if (!formData) return {};

        const values = {};
        formData.fields.forEach((fieldData, field) => {
            const name = field.name || field.id;
            if (name) {
                values[name] = fieldData.state.value;
            }
        });

        return values;
    }

    resetForm(form) {
        const formData = this.forms.get(form);
        if (!formData) return;

        formData.fields.forEach((fieldData, field) => {
            field.value = fieldData.defaultValue;
            fieldData.state = {
                value: fieldData.defaultValue,
                dirty: false,
                touched: false,
                valid: true,
                errors: []
            };
            this.updateFieldUI(form, field);
        });

        formData.state = {
            dirty: false,
            touched: false,
            valid: true,
            submitting: false,
            submitted: false
        };

        this.updateFormUI(form);
    }

    registerValidator(name, validator) {
        this.validators.set(name, validator);
    }

    registerFormatter(name, formatter) {
        this.formatters.set(name, formatter);
    }

    registerMask(name, mask) {
        this.masks.set(name, mask);
    }

    getFormState(form) {
        const formData = this.forms.get(form);
        return formData ? { ...formData.state } : null;
    }

    getFieldState(form, field) {
        const formData = this.forms.get(form);
        const fieldData = formData?.fields.get(field);
        return fieldData ? { ...fieldData.state } : null;
    }

    generateFormId() {
        return `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        this.forms.clear();
        this.validators.clear();
        this.formatters.clear();
        this.masks.clear();
        this.submissions.clear();
        this.state.clear();
        this.validationCache.clear();
    }
} 