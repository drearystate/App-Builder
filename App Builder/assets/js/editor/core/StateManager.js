class StateManager {
    constructor() {
        this.state = new Map();
        this.history = [];
        this.subscribers = new Map();
        this.middleware = [];
        this.initializeState();
    }

    // ... (combined functionality from both files)
} 