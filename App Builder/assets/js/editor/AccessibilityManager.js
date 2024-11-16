class AccessibilityManager {
    constructor() {
        this.elements = new Map();
        this.focusTraps = new Map();
        this.ariaAnnouncer = null;
        this.keyboardManager = null;
        this.roles = new Map();
        this.focusHistory = [];
        this.initializeAccessibility();
    }

    initializeAccessibility() {
        this.setupAriaAnnouncer();
        this.setupKeyboardManager();
        this.setupFocusManagement();
        this.setupRoles();
        this.setupScreenReaderSupport();
    }

    setupAriaAnnouncer() {
        this.ariaAnnouncer = document.createElement('div');
        Object.assign(this.ariaAnnouncer.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0'
        });
        this.ariaAnnouncer.setAttribute('aria-live', 'polite');
        this.ariaAnnouncer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.ariaAnnouncer);
    }

    setupKeyboardManager() {
        this.keyboardManager = {
            shortcuts: new Map(),
            focusableSelectors: [
                'a[href]',
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
                '[contenteditable]'
            ].join(','),
            
            register: (key, callback, options = {}) => {
                this.keyboardManager.shortcuts.set(key, { callback, options });
            },
            
            handleKeyDown: (event) => {
                const key = this.getKeyCombo(event);
                const shortcut = this.keyboardManager.shortcuts.get(key);
                
                if (shortcut) {
                    const { callback, options } = shortcut;
                    if (options.preventDefault) {
                        event.preventDefault();
                    }
                    callback(event);
                }
            }
        };

        document.addEventListener('keydown', this.keyboardManager.handleKeyDown);
    }

    setupFocusManagement() {
        // Track focus history
        document.addEventListener('focusin', (event) => {
            this.focusHistory.push(event.target);
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        });

        // Handle focus traps
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.handleTabNavigation(event);
            }
        });
    }

    setupRoles() {
        // Common ARIA roles and their required properties
        this.roles.set('button', {
            required: ['aria-pressed'],
            optional: ['aria-expanded', 'aria-controls']
        });

        this.roles.set('combobox', {
            required: ['aria-expanded', 'aria-controls'],
            optional: ['aria-activedescendant', 'aria-autocomplete']
        });

        this.roles.set('dialog', {
            required: ['aria-labelledby'],
            optional: ['aria-describedby', 'aria-modal']
        });

        // Add more roles as needed
    }

    setupScreenReaderSupport() {
        // Monitor dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleDynamicContent(mutation.target);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    announce(message, priority = 'polite') {
        const announcer = priority === 'assertive' 
            ? this.createAssertiveAnnouncer() 
            : this.ariaAnnouncer;

        // Clear previous announcement
        announcer.textContent = '';
        
        // Trigger reflow
        void announcer.offsetWidth;
        
        // Set new announcement
        announcer.textContent = message;
    }

    createAssertiveAnnouncer() {
        let announcer = document.querySelector('[aria-live="assertive"]');
        if (!announcer) {
            announcer = this.ariaAnnouncer.cloneNode(true);
            announcer.setAttribute('aria-live', 'assertive');
            document.body.appendChild(announcer);
        }
        return announcer;
    }

    registerElement(element, options = {}) {
        const id = this.generateId();
        
        this.elements.set(id, {
            element,
            options,
            role: options.role,
            focusable: options.focusable !== false,
            announcements: options.announcements || {}
        });

        this.setupElementAccessibility(id);
        return id;
    }

    setupElementAccessibility(id) {
        const { element, options, role } = this.elements.get(id);

        // Set ARIA attributes
        if (role) {
            element.setAttribute('role', role);
            this.setupAriaAttributes(element, role, options);
        }

        // Make focusable if needed
        if (options.focusable) {
            this.makeFocusable(element, options.tabIndex);
        }

        // Add keyboard interaction
        if (options.keyboardHandler) {
            this.addKeyboardHandler(element, options.keyboardHandler);
        }

        // Setup focus trap if needed
        if (options.trapFocus) {
            this.setupFocusTrap(id);
        }
    }

    setupAriaAttributes(element, role, options) {
        const roleConfig = this.roles.get(role);
        if (!roleConfig) return;

        // Set required attributes
        roleConfig.required.forEach(attr => {
            if (!element.hasAttribute(attr)) {
                element.setAttribute(attr, options[attr] || '');
            }
        });

        // Set optional attributes
        roleConfig.optional.forEach(attr => {
            if (options[attr] !== undefined) {
                element.setAttribute(attr, options[attr]);
            }
        });
    }

    makeFocusable(element, tabIndex = 0) {
        if (!element.getAttribute('tabindex')) {
            element.setAttribute('tabindex', tabIndex.toString());
        }
    }

    addKeyboardHandler(element, handler) {
        element.addEventListener('keydown', (event) => {
            handler(event, {
                announce: (message) => this.announce(message),
                focus: (target) => this.focusElement(target)
            });
        });
    }

    setupFocusTrap(id) {
        const { element } = this.elements.get(id);
        const focusableElements = this.getFocusableElements(element);

        this.focusTraps.set(id, {
            element,
            firstFocusable: focusableElements[0],
            lastFocusable: focusableElements[focusableElements.length - 1],
            active: true
        });
    }

    handleTabNavigation(event) {
        const activeTrap = Array.from(this.focusTraps.values())
            .find(trap => trap.active);

        if (!activeTrap) return;

        const { firstFocusable, lastFocusable } = activeTrap;
        const { shiftKey } = event;

        if (!firstFocusable || !lastFocusable) return;

        if (shiftKey && document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
        } else if (!shiftKey && document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
        }
    }

    getFocusableElements(container) {
        return Array.from(
            container.querySelectorAll(this.keyboardManager.focusableSelectors)
        ).filter(el => {
            return el.offsetWidth > 0 && el.offsetHeight > 0;
        });
    }

    focusElement(target) {
        if (typeof target === 'string') {
            target = document.querySelector(target);
        }

        if (target && typeof target.focus === 'function') {
            target.focus();
            return true;
        }

        return false;
    }

    restoreLastFocus() {
        const lastFocused = this.focusHistory[this.focusHistory.length - 2];
        if (lastFocused) {
            this.focusElement(lastFocused);
        }
    }

    handleDynamicContent(element) {
        // Check for elements that need accessibility enhancement
        const newElements = element.querySelectorAll('[data-a11y]');
        newElements.forEach(el => {
            const options = JSON.parse(el.dataset.a11y || '{}');
            this.registerElement(el, options);
        });
    }

    getKeyCombo(event) {
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Meta');
        
        modifiers.push(event.key);
        return modifiers.join('+');
    }

    registerKeyboardShortcut(keys, callback, options = {}) {
        this.keyboardManager.register(keys, callback, options);
    }

    setAriaLabel(element, label) {
        element.setAttribute('aria-label', label);
    }

    setAriaDescribedBy(element, description) {
        const id = this.generateId();
        const descriptionElement = document.createElement('div');
        descriptionElement.id = id;
        descriptionElement.style.display = 'none';
        descriptionElement.textContent = description;
        
        element.parentNode.insertBefore(descriptionElement, element.nextSibling);
        element.setAttribute('aria-describedby', id);
    }

    generateId() {
        return `a11y-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        if (this.ariaAnnouncer) {
            this.ariaAnnouncer.remove();
        }
        
        document.removeEventListener('keydown', this.keyboardManager.handleKeyDown);
        
        this.elements.clear();
        this.focusTraps.clear();
        this.focusHistory = [];
    }
} 