class StatePersistenceManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.storage = window.localStorage;
        this.autoSaveInterval = null;
        this.version = '1.0';
        this.initializeStorage();
    }

    initializeStorage() {
        this.storageKey = 'app_state';
        this.historyKey = 'app_state_history';
        this.maxHistorySize = 10;
        
        // Initialize auto-save
        this.enableAutoSave(5000); // Auto-save every 5 seconds
    }

    async saveState() {
        try {
            const state = this.stateManager.serializeState();
            const stateData = {
                version: this.version,
                timestamp: Date.now(),
                data: state
            };

            await this.storage.setItem(this.storageKey, JSON.stringify(stateData));
            this.addToHistory(stateData);
            return true;
        } catch (error) {
            console.error('Failed to save state:', error);
            return false;
        }
    }

    async loadState() {
        try {
            const stateData = JSON.parse(await this.storage.getItem(this.storageKey));
            
            if (!stateData) return null;
            
            if (stateData.version !== this.version) {
                const migratedState = await this.migrateState(stateData);
                return migratedState;
            }

            return stateData.data;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    async migrateState(oldState) {
        // Implement state migration logic here
        // This should handle converting old state formats to new ones
        console.warn('State migration required');
        return oldState.data;
    }

    enableAutoSave(interval) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.saveState();
        }, interval);
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    async addToHistory(stateData) {
        try {
            let history = JSON.parse(await this.storage.getItem(this.historyKey) || '[]');
            
            history.unshift(stateData);
            
            if (history.length > this.maxHistorySize) {
                history = history.slice(0, this.maxHistorySize);
            }

            await this.storage.setItem(this.historyKey, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to add state to history:', error);
        }
    }

    async getHistory() {
        try {
            return JSON.parse(await this.storage.getItem(this.historyKey) || '[]');
        } catch (error) {
            console.error('Failed to get state history:', error);
            return [];
        }
    }

    async restoreFromHistory(index) {
        try {
            const history = await this.getHistory();
            if (history[index]) {
                await this.storage.setItem(this.storageKey, JSON.stringify(history[index]));
                return history[index].data;
            }
            return null;
        } catch (error) {
            console.error('Failed to restore state from history:', error);
            return null;
        }
    }

    async clearHistory() {
        try {
            await this.storage.removeItem(this.historyKey);
            return true;
        } catch (error) {
            console.error('Failed to clear state history:', error);
            return false;
        }
    }

    async exportState() {
        try {
            const state = await this.loadState();
            return {
                data: state,
                timestamp: Date.now(),
                version: this.version,
                format: 'json'
            };
        } catch (error) {
            console.error('Failed to export state:', error);
            return null;
        }
    }

    async importState(stateData) {
        try {
            if (stateData.version !== this.version) {
                stateData.data = await this.migrateState(stateData);
            }

            await this.storage.setItem(this.storageKey, JSON.stringify(stateData));
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
} 