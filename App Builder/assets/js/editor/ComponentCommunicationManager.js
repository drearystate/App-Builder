class ComponentCommunicationManager {
    constructor() {
        this.components = new Map();
        this.channels = new Map();
        this.eventBus = new Map();
        this.relationships = new Map();
        this.messageQueue = new Map();
        this.initializeCommunication();
    }

    initializeCommunication() {
        this.setupMessageBroker();
        this.setupEventDelegation();
        this.setupComponentDiscovery();
        this.setupChannels();
    }

    setupMessageBroker() {
        // Default channels
        this.createChannel('global');
        this.createChannel('system');
        this.createChannel('ui');
        this.createChannel('data');
    }

    setupEventDelegation() {
        document.addEventListener('component-event', (event) => {
            this.handleDelegatedEvent(event);
        }, true);
    }

    setupComponentDiscovery() {
        this.discoveryObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.discoverComponents(node);
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.removeComponents(node);
                    }
                });
            });
        });

        this.discoveryObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupChannels() {
        // Setup internal communication channels
        this.createChannel('parent-child');
        this.createChannel('sibling');
        this.createChannel('broadcast');
    }

    registerComponent(component, config = {}) {
        const componentId = this.generateComponentId();
        
        this.components.set(componentId, {
            instance: component,
            config,
            relationships: {
                parent: null,
                children: new Set(),
                siblings: new Set()
            },
            subscriptions: new Set(),
            state: 'active'
        });

        this.detectRelationships(componentId);
        this.setupComponentCommunication(componentId);

        return componentId;
    }

    detectRelationships(componentId) {
        const component = this.components.get(componentId);
        if (!component) return;

        const element = component.instance.element;
        if (!element) return;

        // Detect parent
        const parentElement = element.parentElement;
        if (parentElement) {
            const parentComponent = this.findComponentByElement(parentElement);
            if (parentComponent) {
                this.setParentChild(parentComponent.id, componentId);
            }
        }

        // Detect siblings
        const siblings = Array.from(element.parentElement.children);
        siblings.forEach(siblingElement => {
            if (siblingElement !== element) {
                const siblingComponent = this.findComponentByElement(siblingElement);
                if (siblingComponent) {
                    this.setSiblings(componentId, siblingComponent.id);
                }
            }
        });
    }

    setupComponentCommunication(componentId) {
        const component = this.components.get(componentId);
        if (!component) return;

        // Setup message handlers
        component.instance.sendMessage = (message) => {
            this.sendMessage(componentId, message);
        };

        component.instance.broadcast = (message) => {
            this.broadcast(componentId, message);
        };

        component.instance.sendToParent = (message) => {
            this.sendToParent(componentId, message);
        };

        component.instance.sendToChildren = (message) => {
            this.sendToChildren(componentId, message);
        };
    }

    sendMessage(fromId, message) {
        const { to, channel = 'global', data, type } = message;
        
        const messageObj = {
            id: this.generateMessageId(),
            from: fromId,
            to,
            channel,
            data,
            type,
            timestamp: Date.now()
        };

        if (to) {
            this.deliverMessage(messageObj);
        } else {
            this.broadcast(fromId, messageObj);
        }
    }

    deliverMessage(message) {
        const targetComponent = this.components.get(message.to);
        if (!targetComponent) {
            this.queueMessage(message);
            return;
        }

        try {
            targetComponent.instance.handleMessage(message);
        } catch (error) {
            console.error('Error delivering message:', error);
            this.handleMessageError(message, error);
        }
    }

    broadcast(fromId, message) {
        this.components.forEach((component, componentId) => {
            if (componentId !== fromId) {
                try {
                    component.instance.handleMessage({
                        ...message,
                        from: fromId,
                        broadcast: true
                    });
                } catch (error) {
                    console.error('Error broadcasting message:', error);
                }
            }
        });
    }

    sendToParent(fromId, message) {
        const component = this.components.get(fromId);
        if (!component || !component.relationships.parent) return;

        this.sendMessage(fromId, {
            ...message,
            to: component.relationships.parent
        });
    }

    sendToChildren(fromId, message) {
        const component = this.components.get(fromId);
        if (!component) return;

        component.relationships.children.forEach(childId => {
            this.sendMessage(fromId, {
                ...message,
                to: childId
            });
        });
    }

    createChannel(channelName, config = {}) {
        if (this.channels.has(channelName)) return;

        this.channels.set(channelName, {
            name: channelName,
            subscribers: new Set(),
            config: {
                persistent: false,
                ordered: true,
                ...config
            },
            messageHistory: []
        });
    }

    subscribeToChannel(componentId, channelName, handler) {
        const channel = this.channels.get(channelName);
        if (!channel) return false;

        channel.subscribers.add({
            componentId,
            handler
        });

        const component = this.components.get(componentId);
        if (component) {
            component.subscriptions.add(channelName);
        }

        return true;
    }

    unsubscribeFromChannel(componentId, channelName) {
        const channel = this.channels.get(channelName);
        if (!channel) return;

        channel.subscribers = new Set(
            Array.from(channel.subscribers)
                .filter(sub => sub.componentId !== componentId)
        );

        const component = this.components.get(componentId);
        if (component) {
            component.subscriptions.delete(channelName);
        }
    }

    handleDelegatedEvent(event) {
        const { detail } = event;
        const { type, componentId, data } = detail;

        this.eventBus.forEach((handlers, eventType) => {
            if (eventType === type) {
                handlers.forEach(handler => {
                    handler(data, componentId);
                });
            }
        });
    }

    addEventListener(eventType, handler) {
        if (!this.eventBus.has(eventType)) {
            this.eventBus.set(eventType, new Set());
        }
        this.eventBus.get(eventType).add(handler);
    }

    removeEventListener(eventType, handler) {
        if (this.eventBus.has(eventType)) {
            this.eventBus.get(eventType).delete(handler);
        }
    }

    queueMessage(message) {
        const { to } = message;
        if (!this.messageQueue.has(to)) {
            this.messageQueue.set(to, []);
        }
        this.messageQueue.get(to).push(message);
    }

    processMessageQueue(componentId) {
        const messages = this.messageQueue.get(componentId);
        if (!messages) return;

        messages.forEach(message => {
            this.deliverMessage(message);
        });

        this.messageQueue.delete(componentId);
    }

    setParentChild(parentId, childId) {
        const parent = this.components.get(parentId);
        const child = this.components.get(childId);

        if (!parent || !child) return;

        parent.relationships.children.add(childId);
        child.relationships.parent = parentId;
    }

    setSiblings(componentId1, componentId2) {
        const component1 = this.components.get(componentId1);
        const component2 = this.components.get(componentId2);

        if (!component1 || !component2) return;

        component1.relationships.siblings.add(componentId2);
        component2.relationships.siblings.add(componentId1);
    }

    findComponentByElement(element) {
        for (const [id, component] of this.components) {
            if (component.instance.element === element) {
                return { id, ...component };
            }
        }
        return null;
    }

    discoverComponents(rootElement) {
        const componentElements = rootElement.querySelectorAll('[data-component]');
        componentElements.forEach(element => {
            const componentType = element.dataset.component;
            // Handle component registration based on type
            this.handleComponentDiscovery(element, componentType);
        });
    }

    removeComponents(rootElement) {
        const componentIds = new Set();
        
        this.components.forEach((component, id) => {
            if (rootElement.contains(component.instance.element)) {
                componentIds.add(id);
            }
        });

        componentIds.forEach(id => {
            this.unregisterComponent(id);
        });
    }

    unregisterComponent(componentId) {
        const component = this.components.get(componentId);
        if (!component) return;

        // Cleanup subscriptions
        component.subscriptions.forEach(channelName => {
            this.unsubscribeFromChannel(componentId, channelName);
        });

        // Remove relationships
        if (component.relationships.parent) {
            const parent = this.components.get(component.relationships.parent);
            if (parent) {
                parent.relationships.children.delete(componentId);
            }
        }

        component.relationships.siblings.forEach(siblingId => {
            const sibling = this.components.get(siblingId);
            if (sibling) {
                sibling.relationships.siblings.delete(componentId);
            }
        });

        // Remove component
        this.components.delete(componentId);
    }

    generateComponentId() {
        return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanup() {
        this.discoveryObserver.disconnect();
        this.components.clear();
        this.channels.clear();
        this.eventBus.clear();
        this.messageQueue.clear();
    }
} 