class EventSystem {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.eventHandlers = new Map();
        this.initializeEventTypes();
    }

    initializeEventTypes() {
        this.eventTypes = {
            interaction: ['click', 'hover', 'focus', 'blur'],
            form: ['submit', 'change', 'input'],
            data: ['load', 'success', 'error'],
            lifecycle: ['mount', 'unmount', 'update'],
            custom: []
        };
    }

    registerEvent(componentId, eventType, handler) {
        const key = `${componentId}:${eventType}`;
        if (!this.eventHandlers.has(key)) {
            this.eventHandlers.set(key, new Set());
        }
        this.eventHandlers.get(key).add(handler);
        
        this.stateManager.saveState({
            type: 'REGISTER_EVENT',
            componentId,
            eventType
        });
    }

    unregisterEvent(componentId, eventType, handler) {
        const key = `${componentId}:${eventType}`;
        if (this.eventHandlers.has(key)) {
            this.eventHandlers.get(key).delete(handler);
        }
    }

    triggerEvent(componentId, eventType, eventData) {
        const key = `${componentId}:${eventType}`;
        if (this.eventHandlers.has(key)) {
            this.eventHandlers.get(key).forEach(handler => {
                try {
                    handler(eventData);
                } catch (error) {
                    console.error(`Error in event handler for ${key}:`, error);
                }
            });
        }
    }

    addCustomEventType(eventType) {
        if (!this.eventTypes.custom.includes(eventType)) {
            this.eventTypes.custom.push(eventType);
        }
    }

    getAvailableEvents(componentType) {
        // Return available events based on component type
        const events = [...this.eventTypes.interaction];
        
        switch (componentType) {
            case 'form':
                events.push(...this.eventTypes.form);
                break;
            case 'data':
                events.push(...this.eventTypes.data);
                break;
        }

        events.push(...this.eventTypes.lifecycle);
        events.push(...this.eventTypes.custom);
        
        return events;
    }
} 