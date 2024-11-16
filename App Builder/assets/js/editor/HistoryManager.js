class HistoryManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 100;
        this.batchOperations = [];
        this.isRecording = false;
        this.initializeHistory();
    }

    initializeHistory() {
        this.saveInitialState();
        this.setupEventListeners();
    }

    saveInitialState() {
        const initialState = this.stateManager.serializeState();
        this.pushState({
            type: 'INITIAL_STATE',
            state: initialState,
            timestamp: Date.now()
        });
    }

    pushState(action) {
        // Remove any future states if we're not at the latest state
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        this.history.push({
            ...action,
            id: this.generateActionId(),
            timestamp: Date.now()
        });

        // Maintain history size limit
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        this.notifyHistoryChange();
    }

    async undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            await this.applyState(this.history[this.currentIndex]);
            this.notifyHistoryChange();
            return true;
        }
        return false;
    }

    async redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            await this.applyState(this.history[this.currentIndex]);
            this.notifyHistoryChange();
            return true;
        }
        return false;
    }

    async applyState(historyItem) {
        await this.stateManager.restoreState(historyItem.state);
    }

    startBatch() {
        this.isRecording = true;
        this.batchOperations = [];
    }

    addToBatch(action) {
        if (this.isRecording) {
            this.batchOperations.push(action);
        } else {
            this.pushState(action);
        }
    }

    commitBatch(batchName) {
        if (!this.isRecording) return;

        this.pushState({
            type: 'BATCH_OPERATION',
            name: batchName,
            operations: this.batchOperations,
            state: this.stateManager.serializeState()
        });

        this.isRecording = false;
        this.batchOperations = [];
    }

    cancelBatch() {
        this.isRecording = false;
        this.batchOperations = [];
    }

    getHistoryState(index) {
        return this.history[index];
    }

    getCurrentState() {
        return this.history[this.currentIndex];
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        const initialState = this.history[0];
        this.history = [initialState];
        this.currentIndex = 0;
        this.notifyHistoryChange();
    }

    generateActionId() {
        return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    setupEventListeners() {
        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }

    notifyHistoryChange() {
        // Dispatch custom event
        const event = new CustomEvent('historychange', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                currentState: this.getCurrentState()
            }
        });
        document.dispatchEvent(event);
    }

    exportHistory() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            timestamp: Date.now()
        };
    }

    importHistory(data) {
        this.history = data.history;
        this.currentIndex = data.currentIndex;
        this.notifyHistoryChange();
    }
} 