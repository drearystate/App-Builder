class SystemIntegrator {
    constructor() {
        this.systems = new Map();
        this.connections = new Map();
        this.messageQueue = new Queue();
        this.initializeIntegration();
    }

    initializeIntegration() {
        this.setupCoreSystems();
        this.setupSupportSystems();
        this.setupCommunicationLayer();
        this.setupErrorHandling();
        this.setupPerformanceMonitoring();
    }

    setupCoreSystems() {
        // Initialize core systems with dependencies
        const stateManager = new StateManager();
        const eventManager = new EventManager();
        const validationManager = new ValidationManager();

        // Register core systems
        this.registerSystem('state', stateManager);
        this.registerSystem('event', eventManager);
        this.registerSystem('validation', validationManager);

        // Setup core system connections
        this.connectSystems('state', 'event', {
            onStateChange: (change) => eventManager.emit('state:changed', change),
            onEventTrigger: (event) => stateManager.handleEvent(event)
        });
    }

    setupSupportSystems() {
        // Initialize and connect all support systems
        const systems = {
            plugin: new PluginManager(),
            asset: new AssetManager(),
            component: new ComponentRegistryManager(),
            form: new FormManager(),
            undoRedo: new UndoRedoManager(),
            accessibility: new AccessibilityManager(),
            analytics: new AnalyticsManager(),
            error: new ErrorBoundaryManager(),
            performance: new PerformanceOptimizationManager()
        };

        // Register all systems
        Object.entries(systems).forEach(([key, system]) => {
            this.registerSystem(key, system);
        });

        // Setup system dependencies
        this.setupSystemDependencies(systems);
    }

    setupSystemDependencies(systems) {
        // Plugin system dependencies
        this.connectSystems('plugin', 'component', {
            onPluginLoad: (plugin) => systems.component.handlePluginComponents(plugin),
            onComponentRegister: (component) => systems.plugin.notifyPlugins('component:registered', component)
        });

        // Form system dependencies
        this.connectSystems('form', 'validation', {
            onFormSubmit: (form) => systems.validation.validateForm(form),
            onValidationComplete: (result) => systems.form.handleValidationResult(result)
        });

        // Undo/Redo system dependencies
        this.connectSystems('undoRedo', 'state', {
            onUndo: (state) => systems.state.restoreState(state),
            onRedo: (state) => systems.state.restoreState(state)
        });

        // Analytics system dependencies
        this.connectSystems('analytics', ['component', 'form', 'accessibility'], {
            onComponentAction: (action) => systems.analytics.trackComponentAction(action),
            onFormSubmission: (form) => systems.analytics.trackFormSubmission(form),
            onAccessibilityIssue: (issue) => systems.analytics.trackAccessibilityIssue(issue)
        });
    }

    setupCommunicationLayer() {
        // Create a central message bus for system communication
        this.messageBus = {
            publish: (channel, message) => {
                const subscribers = this.connections.get(channel) || [];
                subscribers.forEach(subscriber => {
                    this.messageQueue.enqueue(() => subscriber.handle(message));
                });
                this.messageQueue.process();
            },

            subscribe: (channel, handler) => {
                if (!this.connections.has(channel)) {
                    this.connections.set(channel, new Set());
                }
                this.connections.get(channel).add(handler);
            },

            unsubscribe: (channel, handler) => {
                const subscribers = this.connections.get(channel);
                if (subscribers) {
                    subscribers.delete(handler);
                }
            }
        };

        // Connect all systems to the message bus
        this.systems.forEach((system, name) => {
            if (system.onMessage) {
                this.messageBus.subscribe(`${name}:messages`, system);
            }
        });
    }

    setupErrorHandling() {
        const errorSystem = this.systems.get('error');
        
        // Global error handling
        this.systems.forEach((system, name) => {
            if (system.handleError) {
                system.handleError = (error) => {
                    errorSystem.handleSystemError(name, error);
                };
            }
        });

        // Error recovery strategies
        this.setupErrorRecoveryStrategies();
    }

    setupErrorRecoveryStrategies() {
        const strategies = {
            component: async (error) => {
                const componentSystem = this.systems.get('component');
                await componentSystem.reloadComponent(error.componentId);
            },
            form: async (error) => {
                const formSystem = this.systems.get('form');
                await formSystem.resetForm(error.formId);
            },
            state: async (error) => {
                const stateSystem = this.systems.get('state');
                await stateSystem.rollbackToLastValidState();
            }
        };

        this.systems.get('error').registerRecoveryStrategies(strategies);
    }

    setupPerformanceMonitoring() {
        const performanceSystem = this.systems.get('performance');

        // Monitor system operations
        this.systems.forEach((system, name) => {
            performanceSystem.monitorSystem(name, {
                operations: system.getOperations?.() || [],
                thresholds: system.getPerformanceThresholds?.() || {}
            });
        });

        // Setup performance optimization strategies
        this.setupPerformanceOptimizations();
    }

    setupPerformanceOptimizations() {
        const optimizations = {
            component: {
                lazyLoad: true,
                cacheInstances: true,
                batchUpdates: true
            },
            form: {
                debounceValidation: true,
                cacheResults: true
            },
            state: {
                batchUpdates: true,
                useImmer: true
            }
        };

        this.systems.get('performance').registerOptimizations(optimizations);
    }

    registerSystem(name, system) {
        this.systems.set(name, system);
        system.integrator = this;
        this.setupSystemIntegration(name, system);
    }

    setupSystemIntegration(name, system) {
        // Add standard integration methods to each system
        system.getIntegrator = () => this;
        system.getSystem = (systemName) => this.systems.get(systemName);
        system.publish = (channel, message) => this.messageBus.publish(channel, message);
        system.subscribe = (channel, handler) => this.messageBus.subscribe(channel, handler);
    }

    connectSystems(source, target, handlers) {
        const sourceSystem = this.systems.get(source);
        const targetSystems = Array.isArray(target) 
            ? target.map(t => this.systems.get(t))
            : [this.systems.get(target)];

        Object.entries(handlers).forEach(([event, handler]) => {
            sourceSystem[event] = (...args) => {
                targetSystems.forEach(targetSystem => {
                    handler.apply(targetSystem, args);
                });
            };
        });
    }

    async start() {
        // Initialize all systems in the correct order
        const initOrder = [
            'state',
            'event',
            'validation',
            'plugin',
            'asset',
            'component',
            'form',
            'undoRedo',
            'accessibility',
            'analytics',
            'error',
            'performance'
        ];

        for (const systemName of initOrder) {
            const system = this.systems.get(systemName);
            if (system.initialize) {
                await system.initialize();
            }
        }

        this.messageBus.publish('system:ready', { timestamp: Date.now() });
    }

    cleanup() {
        // Cleanup all systems in reverse order
        Array.from(this.systems.entries())
            .reverse()
            .forEach(([name, system]) => {
                if (system.cleanup) {
                    system.cleanup();
                }
            });

        this.connections.clear();
        this.messageQueue.clear();
    }
}

// Helper Queue class for message processing
class Queue {
    constructor() {
        this.items = [];
        this.processing = false;
    }

    enqueue(item) {
        this.items.push(item);
    }

    async process() {
        if (this.processing) return;
        this.processing = true;

        while (this.items.length > 0) {
            const item = this.items.shift();
            try {
                await item();
            } catch (error) {
                console.error('Queue processing error:', error);
            }
        }

        this.processing = false;
    }

    clear() {
        this.items = [];
        this.processing = false;
    }
} 