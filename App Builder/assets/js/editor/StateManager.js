class StateManager {
    constructor() {
        this.state = {
            components: new Map(),
            selectedComponent: null,
            clipboard: null,
            canvas: {
                width: 375, // Default mobile width
                height: 667,
                scale: 1
            },
            components: {
                registry: new Map(),
                errors: new Map(),
                performance: new Map()
            },
            forms: {
                instances: new Map(),
                validation: new Map(),
                submissions: new Map()
            },
            undoRedo: {
                history: [],
                currentIndex: -1
            },
            accessibility: {
                violations: [],
                fixes: new Map()
            },
            analytics: {
                events: [],
                metrics: new Map()
            }
        };
        
        this.history = [];
        this.currentHistoryIndex = -1;
        this.maxHistoryStates = 50;
        
        // Initialize observers
        this.observers = new Map();
        
        // Bind methods
        this.saveState = this.saveState.bind(this);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);

        // Add state validation
        this.validateState = (state) => {
            // Add validation logic
            return true;
        };

        // Add state persistence
        this.persistState = debounce(async (state) => {
            try {
                await localStorage.setItem('editorState', JSON.stringify(state));
            } catch (error) {
                console.error('State persistence failed:', error);
            }
        }, 1000);

        // Add state recovery
        this.recoverState = async () => {
            try {
                const savedState = await localStorage.getItem('editorState');
                return savedState ? JSON.parse(savedState) : null;
            } catch (error) {
                console.error('State recovery failed:', error);
                return null;
            }
        };
    }

    // State Management Methods
    saveState(action) {
        const stateSnapshot = {
            timestamp: Date.now(),
            action: action,
            state: this.serializeState()
        };

        // Remove any future states if we're not at the latest state
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }

        // Add new state
        this.history.push(stateSnapshot);
        this.currentHistoryIndex++;

        // Limit history size
        if (this.history.length > this.maxHistoryStates) {
            this.history.shift();
            this.currentHistoryIndex--;
        }

        this.notifyObservers('stateChanged', stateSnapshot);
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.restoreState(this.history[this.currentHistoryIndex]);
            this.notifyObservers('undo', this.history[this.currentHistoryIndex]);
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            this.restoreState(this.history[this.currentHistoryIndex]);
            this.notifyObservers('redo', this.history[this.currentHistoryIndex]);
        }
    }

    // Component State Methods
    addComponent(component) {
        this.state.components.set(component.id, component);
        this.saveState({
            type: 'ADD_COMPONENT',
            componentId: component.id
        });
        this.notifyObservers('componentAdded', component);
    }

    updateComponent(componentId, updates) {
        const component = this.state.components.get(componentId);
        if (component) {
            Object.assign(component, updates);
            this.saveState({
                type: 'UPDATE_COMPONENT',
                componentId,
                updates
            });
            this.notifyObservers('componentUpdated', component);
        }
    }

    deleteComponent(componentId) {
        const component = this.state.components.get(componentId);
        if (component) {
            this.state.components.delete(componentId);
            this.saveState({
                type: 'DELETE_COMPONENT',
                componentId
            });
            this.notifyObservers('componentDeleted', componentId);
        }
    }

    // Selection Methods
    setSelectedComponent(componentId) {
        this.state.selectedComponent = componentId;
        this.notifyObservers('selectionChanged', componentId);
    }

    // Clipboard Methods
    copy(componentId) {
        const component = this.state.components.get(componentId);
        if (component) {
            this.state.clipboard = this.serializeComponent(component);
            this.notifyObservers('clipboardUpdated', this.state.clipboard);
        }
    }

    paste(position) {
        if (this.state.clipboard) {
            const newComponent = this.deserializeComponent(this.state.clipboard);
            newComponent.id = this.generateId();
            newComponent.position = position;
            this.addComponent(newComponent);
        }
    }

    // Serialization Methods
    serializeState() {
        return {
            components: Array.from(this.state.components.entries()),
            selectedComponent: this.state.selectedComponent,
            canvas: { ...this.state.canvas }
        };
    }

    serializeComponent(component) {
        return JSON.stringify(component);
    }

    deserializeComponent(serializedComponent) {
        return JSON.parse(serializedComponent);
    }

    // Observer Pattern Methods
    addObserver(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, new Set());
        }
        this.observers.get(event).add(callback);
    }

    removeObserver(event, callback) {
        if (this.observers.has(event)) {
            this.observers.get(event).delete(callback);
        }
    }

    notifyObservers(event, data) {
        if (this.observers.has(event)) {
            this.observers.get(event).forEach(callback => callback(data));
        }
    }

    // Utility Methods
    generateId() {
        return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    restoreState(stateSnapshot) {
        const restoredState = stateSnapshot.state;
        this.state.components = new Map(restoredState.components);
        this.state.selectedComponent = restoredState.selectedComponent;
        this.state.canvas = { ...restoredState.canvas };
        this.notifyObservers('stateRestored', stateSnapshot);
    }

    // Add new state handlers
    handleComponentStateChange(componentId, newState) {
        this.updateState(['components', 'registry', componentId], newState);
        this.notifyStateChange('component', componentId);
    }

    handleFormStateChange(formId, newState) {
        this.updateState(['forms', 'instances', formId], newState);
        this.notifyStateChange('form', formId);
    }
} 