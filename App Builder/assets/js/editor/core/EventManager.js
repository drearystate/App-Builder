import { ErrorManager } from '../core/ErrorManager';

class EventManager {
    constructor() {
        this.events = new Map();
        this.channels = new Map();
        this.subscribers = new Map();
        this.eventQueue = new PriorityQueue();
        this.initializeEventSystem();
    }

    // ... (combined functionality from both files)
} 