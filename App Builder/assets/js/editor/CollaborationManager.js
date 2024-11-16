class CollaborationManager {
    constructor() {
        this.users = new Map();
        this.changes = new Map();
        this.conflicts = new Map();
        this.presence = new Map();
        this.websocket = null;
        this.documentId = null;
        this.currentUser = null;
        this.operationalTransform = new OperationalTransform();
        this.syncInterval = 50; // ms
        this.retryAttempts = 3;
        this.initializeCollaboration();
    }

    async initializeCollaboration() {
        this.setupWebSocket();
        this.setupChangeTracking();
        this.setupPresenceSystem();
        this.setupConflictResolution();
        this.startSyncInterval();
    }

    setupWebSocket() {
        this.websocket = new WebSocket(this.getWebSocketUrl());
        
        this.websocket.onopen = () => {
            this.handleConnectionOpen();
        };

        this.websocket.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };

        this.websocket.onclose = () => {
            this.handleConnectionClose();
        };

        this.websocket.onerror = (error) => {
            this.handleConnectionError(error);
        };
    }

    setupChangeTracking() {
        this.changeBuffer = [];
        this.lastSyncedVersion = 0;
        this.pendingChanges = new Map();
        
        // Setup change observers
        this.changeObserver = new MutationObserver((mutations) => {
            this.handleDOMChanges(mutations);
        });
    }

    setupPresenceSystem() {
        this.lastActivity = Date.now();
        this.presenceInterval = setInterval(() => {
            this.broadcastPresence();
        }, 5000);

        // Track user activity
        document.addEventListener('mousemove', () => this.updateActivity());
        document.addEventListener('keypress', () => this.updateActivity());
    }

    setupConflictResolution() {
        this.conflictStrategies = new Map([
            ['text', this.resolveTextConflict.bind(this)],
            ['structure', this.resolveStructureConflict.bind(this)],
            ['attribute', this.resolveAttributeConflict.bind(this)]
        ]);
    }

    async connect(documentId, user) {
        this.documentId = documentId;
        this.currentUser = user;

        try {
            await this.initializeDocument();
            this.startCollaboration();
            return true;
        } catch (error) {
            console.error('Failed to initialize collaboration:', error);
            return false;
        }
    }

    async initializeDocument() {
        const response = await fetch(`/api/documents/${this.documentId}`);
        if (!response.ok) throw new Error('Failed to fetch document');
        
        const document = await response.json();
        this.lastSyncedVersion = document.version;
        return document;
    }

    startCollaboration() {
        this.changeObserver.observe(document.body, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });

        this.sendMessage({
            type: 'join',
            documentId: this.documentId,
            user: this.currentUser
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'change':
                this.handleRemoteChange(message);
                break;
            case 'presence':
                this.handlePresenceUpdate(message);
                break;
            case 'conflict':
                this.handleConflict(message);
                break;
            case 'sync':
                this.handleSync(message);
                break;
            case 'error':
                this.handleError(message);
                break;
        }
    }

    async handleRemoteChange(message) {
        const { change, author, version } = message;

        try {
            // Transform change against any pending local changes
            const transformedChange = this.operationalTransform.transform(
                change,
                Array.from(this.pendingChanges.values())
            );

            // Apply the transformed change
            await this.applyChange(transformedChange);

            // Update version
            this.lastSyncedVersion = version;

            // Notify listeners
            this.notifyChangeApplied(transformedChange);

        } catch (error) {
            console.error('Error applying remote change:', error);
            this.requestResync();
        }
    }

    async applyChange(change) {
        const { type, path, value, attributes } = change;

        switch (type) {
            case 'insert':
                await this.applyInsert(path, value);
                break;
            case 'delete':
                await this.applyDelete(path);
                break;
            case 'update':
                await this.applyUpdate(path, value);
                break;
            case 'attribute':
                await this.applyAttributeChange(path, attributes);
                break;
        }
    }

    handlePresenceUpdate(message) {
        const { user, state } = message;
        this.presence.set(user.id, {
            ...state,
            lastUpdate: Date.now()
        });

        this.notifyPresenceUpdate(user, state);
    }

    async handleConflict(message) {
        const { changeId, conflictType, conflictData } = message;
        const strategy = this.conflictStrategies.get(conflictType);

        if (strategy) {
            try {
                const resolution = await strategy(conflictData);
                this.sendResolution(changeId, resolution);
            } catch (error) {
                console.error('Conflict resolution failed:', error);
                this.notifyConflictError(changeId, error);
            }
        }
    }

    resolveTextConflict(conflict) {
        const { local, remote } = conflict;
        // Implement text-specific conflict resolution
        return this.operationalTransform.resolveTextConflict(local, remote);
    }

    resolveStructureConflict(conflict) {
        const { local, remote } = conflict;
        // Implement structure-specific conflict resolution
        return this.operationalTransform.resolveStructureConflict(local, remote);
    }

    resolveAttributeConflict(conflict) {
        const { local, remote } = conflict;
        // Implement attribute-specific conflict resolution
        return this.mergeAttributes(local, remote);
    }

    handleDOMChanges(mutations) {
        const changes = mutations.map(mutation => this.createChange(mutation));
        this.queueChanges(changes);
    }

    queueChanges(changes) {
        this.changeBuffer.push(...changes);
        this.scheduleSyncChanges();
    }

    scheduleSyncChanges() {
        if (!this.syncTimeout) {
            this.syncTimeout = setTimeout(() => {
                this.syncChanges();
                this.syncTimeout = null;
            }, this.syncInterval);
        }
    }

    async syncChanges() {
        if (this.changeBuffer.length === 0) return;

        const changes = [...this.changeBuffer];
        this.changeBuffer = [];

        try {
            await this.sendChanges(changes);
        } catch (error) {
            console.error('Failed to sync changes:', error);
            this.changeBuffer.unshift(...changes);
            this.requestResync();
        }
    }

    sendChanges(changes) {
        const changeSet = {
            type: 'changes',
            documentId: this.documentId,
            changes,
            version: this.lastSyncedVersion,
            author: this.currentUser.id
        };

        return this.sendMessage(changeSet);
    }

    sendMessage(message) {
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('WebSocket not connected'));
        }
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.broadcastPresence();
    }

    broadcastPresence() {
        const presence = {
            type: 'presence',
            user: this.currentUser,
            state: {
                active: true,
                lastActivity: this.lastActivity,
                cursor: this.getCurrentCursor(),
                selection: this.getCurrentSelection()
            }
        };

        this.sendMessage(presence);
    }

    getCurrentCursor() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);
        return {
            node: this.getNodePath(range.startContainer),
            offset: range.startOffset
        };
    }

    getCurrentSelection() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);
        return {
            start: {
                node: this.getNodePath(range.startContainer),
                offset: range.startOffset
            },
            end: {
                node: this.getNodePath(range.endContainer),
                offset: range.endOffset
            }
        };
    }

    getNodePath(node) {
        const path = [];
        let current = node;

        while (current && current !== document.body) {
            const parent = current.parentNode;
            if (!parent) break;

            const index = Array.from(parent.childNodes).indexOf(current);
            path.unshift(index);
            current = parent;
        }

        return path;
    }

    cleanup() {
        this.changeObserver.disconnect();
        clearInterval(this.presenceInterval);
        if (this.websocket) {
            this.websocket.close();
        }
    }

    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/collaboration`;
    }
}

// Helper class for Operational Transformation
class OperationalTransform {
    transform(change, pendingChanges) {
        // Implement OT logic here
        return change;
    }

    resolveTextConflict(local, remote) {
        // Implement text conflict resolution
        return local;
    }

    resolveStructureConflict(local, remote) {
        // Implement structure conflict resolution
        return local;
    }
} 