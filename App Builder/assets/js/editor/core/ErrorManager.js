export class ErrorManager {
    constructor() {
        this.errorStack = [];
        this.errorHandlers = new Map();
        this.recoveryStrategies = new Map();
        this.boundaries = new Map();
        this.fallbacks = new Map();
        this.maxStackSize = 50;
        this.initializeErrorManagement();
    }

    // ... (combined functionality from both files)
} 