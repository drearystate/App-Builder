class DataBinding {
    constructor() {
        this.data = {};
        this.bindings = new Map();
        this.computedProperties = new Map();
        this.observers = new Set();
    }

    // Data Management
    setData(path, value) {
        const keys = path.split('.');
        let current = this.data;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        this.notifyBindings(path, value, oldValue);
    }

    getData(path) {
        const keys = path.split('.');
        let current = this.data;
        
        for (const key of keys) {
            if (current === undefined) return undefined;
            current = current[key];
        }
        
        return current;
    }

    // Binding Management
    bind(element, property, path, transformer = null) {
        const binding = {
            element,
            property,
            path,
            transformer,
            update: (value) => {
                const transformedValue = transformer ? transformer(value) : value;
                this.updateElement(element, property, transformedValue);
            }
        };

        if (!this.bindings.has(path)) {
            this.bindings.set(path, new Set());
        }
        this.bindings.get(path).add(binding);

        // Initial update
        binding.update(this.getData(path));
    }

    unbind(element, property, path) {
        if (this.bindings.has(path)) {
            const bindings = this.bindings.get(path);
            bindings.forEach(binding => {
                if (binding.element === element && binding.property === property) {
                    bindings.delete(binding);
                }
            });
            
            if (bindings.size === 0) {
                this.bindings.delete(path);
            }
        }
    }

    // Computed Properties
    addComputed(name, dependencies, computeFunc) {
        this.computedProperties.set(name, {
            dependencies,
            compute: computeFunc
        });

        // Initial computation
        this.updateComputed(name);

        // Add dependency watchers
        dependencies.forEach(dep => {
            this.watch(dep, () => this.updateComputed(name));
        });
    }

    updateComputed(name) {
        const computed = this.computedProperties.get(name);
        if (computed) {
            const depValues = computed.dependencies.map(dep => this.getData(dep));
            const value = computed.compute(...depValues);
            this.setData(name, value);
        }
    }

    // Observers
    watch(path, callback) {
        const observer = { path, callback };
        this.observers.add(observer);
        return () => this.observers.delete(observer);
    }

    // Update Notifications
    notifyBindings(path, newValue, oldValue) {
        if (this.bindings.has(path)) {
            this.bindings.get(path).forEach(binding => {
                binding.update(newValue);
            });
        }

        // Notify observers
        this.observers.forEach(observer => {
            if (observer.path === path) {
                observer.callback(newValue, oldValue);
            }
        });
    }

    // Element Updates
    updateElement(element, property, value) {
        switch (property) {
            case 'text':
                element.textContent = value;
                break;
            case 'value':
                element.value = value;
                break;
            case 'checked':
                element.checked = value;
                break;
            case 'style':
                Object.assign(element.style, value);
                break;
            case 'class':
                element.className = value;
                break;
            default:
                element.setAttribute(property, value);
        }
    }

    // Two-way Binding
    bindTwoWay(element, property, path) {
        // One-way binding from data to element
        this.bind(element, property, path);

        // Binding from element to data
        element.addEventListener('input', () => {
            let value;
            switch (property) {
                case 'checked':
                    value = element.checked;
                    break;
                case 'value':
                default:
                    value = element.value;
            }
            this.setData(path, value);
        });
    }
} 