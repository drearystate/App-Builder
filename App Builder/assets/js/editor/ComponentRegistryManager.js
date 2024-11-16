class ComponentRegistryManager {
    constructor() {
        this.components = new Map();
        this.instances = new Map();
        this.dependencies = new Map();
        this.lifecycles = new Map();
        this.templates = new Map();
        this.config = {
            autoInit: true,
            lazyLoad: true,
            cacheInstances: true
        };
        this.initializeRegistry();

        // Add component validation
        this.validateComponent = (component) => {
            const required = ['name', 'template', 'methods'];
            const missing = required.filter(prop => !component[prop]);
            if (missing.length > 0) {
                throw new Error(`Component missing required properties: ${missing.join(', ')}`);
            }
            return true;
        };

        // Add component caching
        this.componentCache = new Map();
        
        // Add component lazy loading
        this.lazyLoadComponent = async (componentName) => {
            if (!this.componentCache.has(componentName)) {
                const component = await this.loadComponent(componentName);
                this.componentCache.set(componentName, component);
            }
            return this.componentCache.get(componentName);
        };
    }

    initializeRegistry() {
        this.setupComponentDiscovery();
        this.setupDependencyInjection();
        this.setupLifecycleHooks();
        this.setupTemplateSystem();
        this.setupEventHandlers();
    }

    setupComponentDiscovery() {
        // Setup mutation observer for auto-discovery
        this.discoveryObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.discoverComponents(node);
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.cleanupComponents(node);
                    }
                });
            });
        });

        if (this.config.autoInit) {
            this.discoveryObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    setupDependencyInjection() {
        this.injector = {
            providers: new Map(),
            
            register: (token, provider) => {
                this.injector.providers.set(token, provider);
            },
            
            resolve: (token) => {
                const provider = this.injector.providers.get(token);
                if (!provider) {
                    throw new Error(`No provider found for ${token}`);
                }
                return typeof provider === 'function' ? provider() : provider;
            },
            
            inject: (target, dependencies) => {
                dependencies.forEach(({ token, property }) => {
                    Object.defineProperty(target, property, {
                        get: () => this.injector.resolve(token)
                    });
                });
            }
        };
    }

    setupLifecycleHooks() {
        // Define standard lifecycle hooks
        this.lifecycleHooks = {
            beforeCreate: new Set(),
            created: new Set(),
            beforeMount: new Set(),
            mounted: new Set(),
            beforeUpdate: new Set(),
            updated: new Set(),
            beforeDestroy: new Set(),
            destroyed: new Set()
        };

        // Setup lifecycle tracking
        this.lifecycles = new Map();
    }

    setupTemplateSystem() {
        this.templateEngine = {
            compile: (template) => {
                return (data) => {
                    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
                        return data[key.trim()];
                    });
                };
            },
            
            render: (template, data) => {
                const compiled = this.templateEngine.compile(template);
                return compiled(data);
            }
        };
    }

    setupEventHandlers() {
        window.addEventListener('component-ready', (event) => {
            const { componentId } = event.detail;
            this.handleComponentReady(componentId);
        });

        window.addEventListener('component-error', (event) => {
            const { componentId, error } = event.detail;
            this.handleComponentError(componentId, error);
        });
    }

    registerComponent(name, config) {
        if (this.components.has(name)) {
            throw new Error(`Component ${name} is already registered`);
        }

        const component = {
            name,
            config: {
                template: config.template,
                styles: config.styles,
                props: config.props || {},
                methods: config.methods || {},
                lifecycle: config.lifecycle || {},
                dependencies: config.dependencies || [],
                ...config
            },
            factory: this.createComponentFactory(config)
        };

        this.components.set(name, component);
        this.setupComponentTemplate(name, config.template);
        this.registerDependencies(name, config.dependencies);

        return component;
    }

    createComponentFactory(config) {
        return class Component {
            constructor(element, props = {}) {
                this.element = element;
                this.props = { ...config.props, ...props };
                this.state = {};
                this.refs = {};
                
                // Setup component internals
                this.setupInternals();
                
                // Initialize component
                this.initialize();
            }

            setupInternals() {
                // Setup reactive properties
                this.setupReactivity();
                
                // Setup method bindings
                this.bindMethods();
                
                // Setup refs
                this.setupRefs();
            }

            setupReactivity() {
                // Implementation of reactive system
                const proxy = new Proxy(this.state, {
                    set: (target, property, value) => {
                        const oldValue = target[property];
                        target[property] = value;
                        this.onStateChange(property, value, oldValue);
                        return true;
                    }
                });

                this.state = proxy;
            }

            bindMethods() {
                Object.entries(config.methods || {}).forEach(([name, method]) => {
                    this[name] = method.bind(this);
                });
            }

            setupRefs() {
                this.element.querySelectorAll('[ref]').forEach(el => {
                    const refName = el.getAttribute('ref');
                    this.refs[refName] = el;
                });
            }

            initialize() {
                // Call lifecycle hooks
                this.callLifecycleHook('beforeCreate');
                
                // Initialize state
                this.initializeState();
                
                // Setup template
                this.setupTemplate();
                
                // Setup event listeners
                this.setupEventListeners();
                
                // Call created hook
                this.callLifecycleHook('created');
            }

            initializeState() {
                if (config.state) {
                    Object.entries(config.state).forEach(([key, value]) => {
                        this.state[key] = typeof value === 'function' ? value() : value;
                    });
                }
            }

            setupTemplate() {
                if (config.template) {
                    const rendered = this.renderTemplate();
                    this.element.innerHTML = rendered;
                }
            }

            setupEventListeners() {
                if (config.events) {
                    Object.entries(config.events).forEach(([event, handler]) => {
                        this.element.addEventListener(event, handler.bind(this));
                    });
                }
            }

            renderTemplate() {
                return this.templateEngine.render(config.template, {
                    ...this.props,
                    ...this.state,
                    refs: this.refs
                });
            }

            callLifecycleHook(hook) {
                const hookFn = config.lifecycle[hook];
                if (hookFn) {
                    hookFn.call(this);
                }
            }

            onStateChange(property, newValue, oldValue) {
                this.callLifecycleHook('beforeUpdate');
                this.updateTemplate();
                this.callLifecycleHook('updated');
            }

            updateTemplate() {
                if (config.template) {
                    const rendered = this.renderTemplate();
                    this.element.innerHTML = rendered;
                    this.setupRefs();
                }
            }

            destroy() {
                this.callLifecycleHook('beforeDestroy');
                
                // Cleanup event listeners
                this.cleanupEventListeners();
                
                // Cleanup refs
                this.refs = {};
                
                // Clear state
                this.state = {};
                
                this.callLifecycleHook('destroyed');
            }

            cleanupEventListeners() {
                if (config.events) {
                    Object.entries(config.events).forEach(([event, handler]) => {
                        this.element.removeEventListener(event, handler.bind(this));
                    });
                }
            }
        };
    }

    setupComponentTemplate(name, template) {
        if (template) {
            const compiled = this.templateEngine.compile(template);
            this.templates.set(name, compiled);
        }
    }

    registerDependencies(name, dependencies = []) {
        if (dependencies.length > 0) {
            this.dependencies.set(name, dependencies);
        }
    }

    createInstance(name, element, props = {}) {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Component ${name} not found`);
        }

        // Resolve dependencies
        const dependencies = this.dependencies.get(name) || [];
        const resolvedDeps = dependencies.map(dep => this.injector.resolve(dep));

        // Create instance
        const instance = new component.factory(element, props);
        
        // Inject dependencies
        this.injector.inject(instance, dependencies);

        // Store instance
        const instanceId = this.generateInstanceId();
        this.instances.set(instanceId, instance);

        // Setup lifecycle tracking
        this.trackLifecycle(instanceId, instance);

        return instanceId;
    }

    discoverComponents(rootElement) {
        const componentElements = rootElement.querySelectorAll('[data-component]');
        componentElements.forEach(element => {
            const name = element.dataset.component;
            const props = this.parseProps(element);
            
            if (this.components.has(name)) {
                this.createInstance(name, element, props);
            }
        });
    }

    parseProps(element) {
        const props = {};
        Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-prop-'))
            .forEach(attr => {
                const propName = attr.name.replace('data-prop-', '');
                props[propName] = attr.value;
            });
        return props;
    }

    cleanupComponents(rootElement) {
        const instanceIds = new Set();
        
        this.instances.forEach((instance, id) => {
            if (rootElement.contains(instance.element)) {
                instanceIds.add(id);
            }
        });

        instanceIds.forEach(id => {
            this.destroyInstance(id);
        });
    }

    destroyInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.destroy();
            this.instances.delete(instanceId);
            this.lifecycles.delete(instanceId);
        }
    }

    trackLifecycle(instanceId, instance) {
        this.lifecycles.set(instanceId, {
            created: Date.now(),
            lastUpdated: null,
            updateCount: 0
        });

        // Track updates
        const originalUpdate = instance.updateTemplate.bind(instance);
        instance.updateTemplate = (...args) => {
            const lifecycle = this.lifecycles.get(instanceId);
            lifecycle.lastUpdated = Date.now();
            lifecycle.updateCount++;
            return originalUpdate(...args);
        };
    }

    handleComponentReady(componentId) {
        const instance = this.instances.get(componentId);
        if (instance) {
            instance.callLifecycleHook('mounted');
        }
    }

    handleComponentError(componentId, error) {
        console.error(`Error in component ${componentId}:`, error);
        // Implement error handling strategy
    }

    getComponent(name) {
        return this.components.get(name);
    }

    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    getInstancesByComponent(name) {
        return Array.from(this.instances.values())
            .filter(instance => instance.constructor.name === name);
    }

    generateInstanceId() {
        return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        this.discoveryObserver.disconnect();
        Array.from(this.instances.keys()).forEach(id => {
            this.destroyInstance(id);
        });
        this.components.clear();
        this.dependencies.clear();
        this.templates.clear();
    }
} 