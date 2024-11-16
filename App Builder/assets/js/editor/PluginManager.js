class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.extensions = new Map();
        this.dependencies = new Map();
        this.registry = new Map();
        this.state = new Map();
        this.extensionPoints = {
            'component:beforeRegister': new Set(),
            'component:afterRegister': new Set(),
            'form:beforeSubmit': new Set(),
            'form:afterSubmit': new Set(),
            'undoRedo:beforeUndo': new Set(),
            'undoRedo:afterUndo': new Set(),
            'accessibility:check': new Set(),
            'analytics:track': new Set()
        };
        this.initializePluginSystem();
    }

    initializePluginSystem() {
        this.setupDefaultHooks();
        this.setupExtensionPoints();
        this.setupPluginRegistry();
    }

    setupDefaultHooks() {
        // Lifecycle hooks
        this.registerHook('beforeInit');
        this.registerHook('afterInit');
        this.registerHook('beforeUnload');
        this.registerHook('afterUnload');

        // Component hooks
        this.registerHook('beforeComponentRender');
        this.registerHook('afterComponentRender');
        this.registerHook('beforeComponentUpdate');
        this.registerHook('afterComponentUpdate');

        // Data hooks
        this.registerHook('beforeDataLoad');
        this.registerHook('afterDataLoad');
        this.registerHook('beforeDataSave');
        this.registerHook('afterDataSave');

        // UI hooks
        this.registerHook('beforeUIUpdate');
        this.registerHook('afterUIUpdate');
        this.registerHook('onThemeChange');
        this.registerHook('onLayoutChange');

        // Plugin hooks
        this.registerHook('onComponentRegister');
        this.registerHook('onFormSubmit');
        this.registerHook('onUndoRedo');
        this.registerHook('onAccessibilityCheck');
        this.registerHook('onAnalyticsEvent');
    }

    setupExtensionPoints() {
        // UI extension points
        this.registerExtensionPoint('toolbar', {
            type: 'component',
            multiple: true,
            position: 'append'
        });

        this.registerExtensionPoint('sidebar', {
            type: 'component',
            multiple: true,
            position: 'append'
        });

        this.registerExtensionPoint('contextMenu', {
            type: 'menu',
            multiple: true,
            merge: true
        });

        // Data extension points
        this.registerExtensionPoint('dataTransformer', {
            type: 'function',
            multiple: true,
            chain: true
        });

        this.registerExtensionPoint('validator', {
            type: 'function',
            multiple: true,
            chain: true
        });
    }

    async registerPlugin(pluginConfig) {
        const { id, name, version, dependencies = [], main } = pluginConfig;

        // Check if plugin is already registered
        if (this.plugins.has(id)) {
            throw new Error(`Plugin ${id} is already registered`);
        }

        // Validate dependencies
        await this.validateDependencies(dependencies);

        // Create plugin instance
        const plugin = {
            id,
            name,
            version,
            dependencies,
            instance: null,
            state: 'registered',
            config: pluginConfig
        };

        try {
            // Load plugin module
            const pluginModule = typeof main === 'function' ? main : await import(main);
            
            // Initialize plugin
            plugin.instance = await this.initializePlugin(pluginModule, pluginConfig);
            plugin.state = 'initialized';
            
            // Store plugin
            this.plugins.set(id, plugin);
            
            // Register dependencies
            this.registerDependencies(id, dependencies);
            
            // Trigger hooks
            await this.triggerHook('afterInit', plugin);
            
            return plugin;
        } catch (error) {
            plugin.state = 'error';
            plugin.error = error;
            throw error;
        }
    }

    async initializePlugin(pluginModule, config) {
        const plugin = new pluginModule.default(this, config);
        await this.triggerHook('beforeInit', plugin);
        
        if (typeof plugin.initialize === 'function') {
            await plugin.initialize();
        }

        return plugin;
    }

    async unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        // Check for dependent plugins
        const dependents = this.findDependentPlugins(pluginId);
        if (dependents.length > 0) {
            throw new Error(`Cannot unregister plugin ${pluginId}: other plugins depend on it`);
        }

        try {
            await this.triggerHook('beforeUnload', plugin);

            // Cleanup plugin
            if (typeof plugin.instance.cleanup === 'function') {
                await plugin.instance.cleanup();
            }

            // Remove extensions
            this.removePluginExtensions(pluginId);

            // Remove hooks
            this.removePluginHooks(pluginId);

            // Remove dependencies
            this.dependencies.delete(pluginId);

            // Remove plugin
            this.plugins.delete(pluginId);

            await this.triggerHook('afterUnload', plugin);
        } catch (error) {
            console.error(`Error unregistering plugin ${pluginId}:`, error);
            throw error;
        }
    }

    async validateDependencies(dependencies) {
        for (const dep of dependencies) {
            const [pluginId, version] = dep.split('@');
            const plugin = this.plugins.get(pluginId);

            if (!plugin) {
                throw new Error(`Missing dependency: ${pluginId}`);
            }

            if (version && !this.isVersionCompatible(plugin.version, version)) {
                throw new Error(`Incompatible dependency version: ${dep}`);
            }
        }
    }

    registerDependencies(pluginId, dependencies) {
        this.dependencies.set(pluginId, dependencies);
    }

    findDependentPlugins(pluginId) {
        return Array.from(this.dependencies.entries())
            .filter(([_, deps]) => deps.some(dep => dep.startsWith(pluginId)))
            .map(([id]) => id);
    }

    registerHook(hookName) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, new Map());
        }
    }

    addHookListener(hookName, pluginId, callback, priority = 10) {
        if (!this.hooks.has(hookName)) {
            throw new Error(`Hook ${hookName} does not exist`);
        }

        const hookListeners = this.hooks.get(hookName);
        if (!hookListeners.has(pluginId)) {
            hookListeners.set(pluginId, []);
        }

        hookListeners.get(pluginId).push({ callback, priority });
    }

    async triggerHook(hookName, ...args) {
        if (!this.hooks.has(hookName)) return;

        const listeners = Array.from(this.hooks.get(hookName).values())
            .flat()
            .sort((a, b) => b.priority - a.priority);

        for (const { callback } of listeners) {
            await callback(...args);
        }
    }

    registerExtensionPoint(pointName, config) {
        this.extensions.set(pointName, {
            config,
            extensions: new Map()
        });
    }

    addExtension(pointName, pluginId, extension) {
        if (!this.extensions.has(pointName)) {
            throw new Error(`Extension point ${pointName} does not exist`);
        }

        const point = this.extensions.get(pointName);
        point.extensions.set(pluginId, extension);
    }

    getExtensions(pointName) {
        const point = this.extensions.get(pointName);
        if (!point) return [];

        return Array.from(point.extensions.values());
    }

    removePluginExtensions(pluginId) {
        for (const point of this.extensions.values()) {
            point.extensions.delete(pluginId);
        }
    }

    removePluginHooks(pluginId) {
        for (const hookListeners of this.hooks.values()) {
            hookListeners.delete(pluginId);
        }
    }

    isVersionCompatible(actual, required) {
        // Implement semver compatibility check
        return true; // Simplified for example
    }

    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }

    getPluginState(pluginId) {
        return this.state.get(pluginId);
    }

    setPluginState(pluginId, state) {
        this.state.set(pluginId, state);
    }

    async enablePlugin(pluginId) {
        const plugin = this.getPlugin(pluginId);
        if (!plugin || plugin.state !== 'initialized') return;

        if (typeof plugin.instance.enable === 'function') {
            await plugin.instance.enable();
        }
        plugin.state = 'enabled';
    }

    async disablePlugin(pluginId) {
        const plugin = this.getPlugin(pluginId);
        if (!plugin || plugin.state !== 'enabled') return;

        if (typeof plugin.instance.disable === 'function') {
            await plugin.instance.disable();
        }
        plugin.state = 'disabled';
    }

    setupPluginRegistry() {
        // Setup plugin discovery and registration
        if (typeof window !== 'undefined') {
            window.registerPlugin = (config) => this.registerPlugin(config);
        }
    }
}

// Example Plugin Base Class
class PluginBase {
    constructor(manager, config) {
        this.manager = manager;
        this.config = config;
        this.id = config.id;
    }

    async initialize() {
        // Override in plugin implementation
    }

    async cleanup() {
        // Override in plugin implementation
    }

    async enable() {
        // Override in plugin implementation
    }

    async disable() {
        // Override in plugin implementation
    }
} 