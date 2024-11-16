class UndoRedoManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 100;
        this.batchOperations = new Map();
        this.isRecording = false;
        this.snapshots = new Map();
        this.commandFactories = new Map();
        this.initializeUndoRedo();
    }

    initializeUndoRedo() {
        this.setupCommandFactories();
        this.setupKeyboardShortcuts();
        this.setupStateTracking();
        this.setupBatchOperations();
    }

    setupCommandFactories() {
        // Text editing commands
        this.registerCommand('textEdit', {
            execute: (state) => {
                const { element, newText, oldText } = state;
                element.textContent = newText;
                return true;
            },
            undo: (state) => {
                const { element, oldText } = state;
                element.textContent = oldText;
                return true;
            },
            combine: (oldState, newState) => {
                // Combine consecutive text edits within 1 second
                if (newState.timestamp - oldState.timestamp < 1000 &&
                    oldState.element === newState.element) {
                    return {
                        ...newState,
                        oldText: oldState.oldText
                    };
                }
                return null;
            }
        });

        // Style change commands
        this.registerCommand('styleChange', {
            execute: (state) => {
                const { element, property, newValue, oldValue } = state;
                element.style[property] = newValue;
                return true;
            },
            undo: (state) => {
                const { element, property, oldValue } = state;
                element.style[property] = oldValue;
                return true;
            }
        });

        // Element manipulation commands
        this.registerCommand('elementAdd', {
            execute: (state) => {
                const { parent, element, nextSibling } = state;
                parent.insertBefore(element, nextSibling || null);
                return true;
            },
            undo: (state) => {
                const { element } = state;
                element.remove();
                return true;
            }
        });

        this.registerCommand('elementRemove', {
            execute: (state) => {
                const { element } = state;
                state.parent = element.parentNode;
                state.nextSibling = element.nextSibling;
                element.remove();
                return true;
            },
            undo: (state) => {
                const { parent, element, nextSibling } = state;
                parent.insertBefore(element, nextSibling || null);
                return true;
            }
        });

        // Attribute change commands
        this.registerCommand('attributeChange', {
            execute: (state) => {
                const { element, attribute, newValue, oldValue } = state;
                if (newValue === null) {
                    element.removeAttribute(attribute);
                } else {
                    element.setAttribute(attribute, newValue);
                }
                return true;
            },
            undo: (state) => {
                const { element, attribute, oldValue } = state;
                if (oldValue === null) {
                    element.removeAttribute(attribute);
                } else {
                    element.setAttribute(attribute, oldValue);
                }
                return true;
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                if (event.key === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                } else if (event.key === 'y') {
                    event.preventDefault();
                    this.redo();
                }
            }
        });
    }

    setupStateTracking() {
        this.stateObserver = new MutationObserver((mutations) => {
            if (this.isRecording) {
                mutations.forEach(mutation => {
                    this.handleMutation(mutation);
                });
            }
        });

        this.stateObserver.observe(document.body, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });
    }

    setupBatchOperations() {
        this.batchTypes = {
            'drag': (operations) => {
                // Combine drag operations
                return operations.length > 0 ? [operations[operations.length - 1]] : [];
            },
            'resize': (operations) => {
                // Combine resize operations
                return operations.length > 0 ? [operations[operations.length - 1]] : [];
            },
            'default': (operations) => operations
        };
    }

    registerCommand(type, commandFactory) {
        this.commandFactories.set(type, commandFactory);
    }

    createCommand(type, state) {
        const factory = this.commandFactories.get(type);
        if (!factory) throw new Error(`Unknown command type: ${type}`);

        return {
            type,
            state: { ...state, timestamp: Date.now() },
            execute: () => factory.execute(state),
            undo: () => factory.undo(state),
            combine: factory.combine
        };
    }

    execute(command) {
        // Clear redo history when new command is executed
        if (this.currentIndex < this.history.length - 1) {
            this.history.splice(this.currentIndex + 1);
        }

        // Try to combine with previous command
        const prevCommand = this.history[this.currentIndex];
        if (prevCommand && prevCommand.type === command.type && prevCommand.combine) {
            const combinedState = prevCommand.combine(prevCommand.state, command.state);
            if (combinedState) {
                prevCommand.state = combinedState;
                command.execute();
                return;
            }
        }

        // Execute and add to history
        if (command.execute()) {
            this.history.push(command);
            this.currentIndex++;

            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.currentIndex--;
            }

            this.notifyHistoryChange();
        }
    }

    undo() {
        if (!this.canUndo()) return false;

        const command = this.history[this.currentIndex];
        if (command.undo()) {
            this.currentIndex--;
            this.notifyHistoryChange();
            return true;
        }
        return false;
    }

    redo() {
        if (!this.canRedo()) return false;

        const command = this.history[this.currentIndex + 1];
        if (command.execute()) {
            this.currentIndex++;
            this.notifyHistoryChange();
            return true;
        }
        return false;
    }

    startBatch(batchId, type = 'default') {
        this.batchOperations.set(batchId, {
            type,
            operations: [],
            timestamp: Date.now()
        });
    }

    addToBatch(batchId, command) {
        const batch = this.batchOperations.get(batchId);
        if (batch) {
            batch.operations.push(command);
        }
    }

    endBatch(batchId) {
        const batch = this.batchOperations.get(batchId);
        if (!batch) return;

        const combiner = this.batchTypes[batch.type] || this.batchTypes.default;
        const operations = combiner(batch.operations);

        if (operations.length > 0) {
            const batchCommand = this.createBatchCommand(operations);
            this.execute(batchCommand);
        }

        this.batchOperations.delete(batchId);
    }

    createBatchCommand(operations) {
        return {
            type: 'batch',
            state: {
                operations,
                timestamp: Date.now()
            },
            execute: () => {
                return operations.every(op => op.execute());
            },
            undo: () => {
                return operations.reverse().every(op => op.undo());
            }
        };
    }

    createSnapshot() {
        const snapshotId = this.generateSnapshotId();
        this.snapshots.set(snapshotId, {
            historyIndex: this.currentIndex,
            timestamp: Date.now()
        });
        return snapshotId;
    }

    restoreSnapshot(snapshotId) {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot) return false;

        while (this.currentIndex > snapshot.historyIndex) {
            this.undo();
        }
        while (this.currentIndex < snapshot.historyIndex) {
            this.redo();
        }

        return true;
    }

    handleMutation(mutation) {
        let command;

        switch (mutation.type) {
            case 'characterData':
                command = this.createCommand('textEdit', {
                    element: mutation.target,
                    newText: mutation.target.textContent,
                    oldText: mutation.oldValue
                });
                break;

            case 'attributes':
                command = this.createCommand('attributeChange', {
                    element: mutation.target,
                    attribute: mutation.attributeName,
                    newValue: mutation.target.getAttribute(mutation.attributeName),
                    oldValue: mutation.oldValue
                });
                break;

            case 'childList':
                mutation.addedNodes.forEach(node => {
                    command = this.createCommand('elementAdd', {
                        parent: mutation.target,
                        element: node,
                        nextSibling: node.nextSibling
                    });
                    this.execute(command);
                });

                mutation.removedNodes.forEach(node => {
                    command = this.createCommand('elementRemove', {
                        element: node
                    });
                    this.execute(command);
                });
                break;
        }

        if (command) {
            this.execute(command);
        }
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    getHistory() {
        return this.history.slice(0, this.currentIndex + 1);
    }

    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.notifyHistoryChange();
    }

    setMaxHistorySize(size) {
        this.maxHistorySize = size;
        while (this.history.length > size) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    startRecording() {
        this.isRecording = true;
    }

    stopRecording() {
        this.isRecording = false;
    }

    notifyHistoryChange() {
        window.dispatchEvent(new CustomEvent('historychange', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                historySize: this.history.length,
                currentIndex: this.currentIndex
            }
        }));
    }

    generateSnapshotId() {
        return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        this.stateObserver.disconnect();
        this.history = [];
        this.currentIndex = -1;
        this.batchOperations.clear();
        this.snapshots.clear();
    }
} 