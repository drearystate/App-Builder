class EventManager {
    constructor() {
        // Add new event types for new systems
        this.eventTypes = {
            // ... existing events ...
            COMPONENT_REGISTERED: 'component:registered',
            COMPONENT_ERROR: 'component:error',
            FORM_SUBMIT: 'form:submit',
            FORM_ERROR: 'form:error',
            UNDO_PERFORMED: 'undo:performed',
            REDO_PERFORMED: 'redo:performed',
            PERFORMANCE_ISSUE: 'performance:issue',
            ACCESSIBILITY_VIOLATION: 'accessibility:violation',
            ANALYTICS_EVENT: 'analytics:event'
        };

        // Add event validation
        this.validateEvent = (event) => {
            if (!event.type) {
                throw new Error('Event must have a type');
            }
            return true;
        };

        // Add event prioritization
        this.eventPriorities = new Map();
        
        // Add event queuing
        this.eventQueue = [];
        
        // Add event batching
        this.batchEvents = (events) => {
            return events.sort((a, b) => {
                const priorityA = this.eventPriorities.get(a.type) || 0;
                const priorityB = this.eventPriorities.get(b.type) || 0;
                return priorityB - priorityA;
            });
        };
    }
} 