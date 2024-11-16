class BaseManager {
    constructor() {
        this.observers = new Set();
        this.eventListeners = new Map();
    }

    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.type, listener.handler);
        });
        this.eventListeners.clear();
        
        // Clear all observers
        this.observers.clear();
        
        // Clear all references
        this.reset();
    }

    reset() {
        // Override in child classes
    }
} 