class InteractionManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.interactions = new Map();
        this.eventListeners = new Map();
        this.gestureRecognizers = new Map();
        this.initializeInteractions();
    }

    initializeInteractions() {
        // Basic interactions
        this.registerInteraction('click', {
            type: 'event',
            handler: (element, callback) => {
                element.addEventListener('click', callback);
                return () => element.removeEventListener('click', callback);
            }
        });

        this.registerInteraction('hover', {
            type: 'state',
            enter: (element, callback) => {
                element.addEventListener('mouseenter', callback);
                return () => element.removeEventListener('mouseenter', callback);
            },
            exit: (element, callback) => {
                element.addEventListener('mouseleave', callback);
                return () => element.removeEventListener('mouseleave', callback);
            }
        });

        // Gesture interactions
        this.registerInteraction('swipe', {
            type: 'gesture',
            handler: this.createSwipeRecognizer.bind(this)
        });

        this.registerInteraction('pinch', {
            type: 'gesture',
            handler: this.createPinchRecognizer.bind(this)
        });

        // Drag and Drop
        this.registerInteraction('draggable', {
            type: 'behavior',
            handler: this.enableDragging.bind(this)
        });

        // Custom interactions
        this.registerInteraction('longPress', {
            type: 'gesture',
            handler: this.createLongPressRecognizer.bind(this)
        });
    }

    registerInteraction(name, config) {
        this.interactions.set(name, config);
    }

    addInteraction(element, interactionName, options = {}) {
        const interaction = this.interactions.get(interactionName);
        if (!interaction) {
            throw new Error(`Interaction '${interactionName}' not found`);
        }

        switch (interaction.type) {
            case 'event':
                return this.addEventInteraction(element, interaction, options);
            case 'state':
                return this.addStateInteraction(element, interaction, options);
            case 'gesture':
                return this.addGestureInteraction(element, interaction, options);
            case 'behavior':
                return this.addBehaviorInteraction(element, interaction, options);
            default:
                throw new Error(`Unknown interaction type: ${interaction.type}`);
        }
    }

    addEventInteraction(element, interaction, { callback }) {
        const cleanup = interaction.handler(element, callback);
        this.storeEventListener(element, interaction, cleanup);
        return cleanup;
    }

    addStateInteraction(element, interaction, { onEnter, onExit }) {
        const enterCleanup = interaction.enter(element, onEnter);
        const exitCleanup = interaction.exit(element, onExit);
        
        const cleanup = () => {
            enterCleanup();
            exitCleanup();
        };
        
        this.storeEventListener(element, interaction, cleanup);
        return cleanup;
    }

    addGestureInteraction(element, interaction, options) {
        const recognizer = interaction.handler(element, options);
        this.gestureRecognizers.set(element, recognizer);
        return () => this.gestureRecognizers.delete(element);
    }

    addBehaviorInteraction(element, interaction, options) {
        return interaction.handler(element, options);
    }

    createSwipeRecognizer(element, { onSwipe, threshold = 50, direction = 'horizontal' }) {
        let startX, startY;

        const handleStart = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        };

        const handleEnd = (e) => {
            if (!startX || !startY) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            if (direction === 'horizontal' && Math.abs(deltaX) > threshold) {
                onSwipe({ direction: deltaX > 0 ? 'right' : 'left', delta: deltaX });
            } else if (direction === 'vertical' && Math.abs(deltaY) > threshold) {
                onSwipe({ direction: deltaY > 0 ? 'down' : 'up', delta: deltaY });
            }

            startX = startY = null;
        };

        element.addEventListener('touchstart', handleStart);
        element.addEventListener('touchend', handleEnd);

        return () => {
            element.removeEventListener('touchstart', handleStart);
            element.removeEventListener('touchend', handleEnd);
        };
    }

    createPinchRecognizer(element, { onPinch }) {
        let initialDistance;

        const getDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const handleStart = (e) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches);
            }
        };

        const handleMove = (e) => {
            if (e.touches.length === 2 && initialDistance) {
                const currentDistance = getDistance(e.touches);
                const scale = currentDistance / initialDistance;
                onPinch({ scale });
            }
        };

        const handleEnd = () => {
            initialDistance = null;
        };

        element.addEventListener('touchstart', handleStart);
        element.addEventListener('touchmove', handleMove);
        element.addEventListener('touchend', handleEnd);

        return () => {
            element.removeEventListener('touchstart', handleStart);
            element.removeEventListener('touchmove', handleMove);
            element.removeEventListener('touchend', handleEnd);
        };
    }

    createLongPressRecognizer(element, { onLongPress, duration = 500 }) {
        let timeoutId;

        const handleStart = () => {
            timeoutId = setTimeout(() => onLongPress(), duration);
        };

        const handleEnd = () => {
            clearTimeout(timeoutId);
        };

        element.addEventListener('touchstart', handleStart);
        element.addEventListener('touchend', handleEnd);
        element.addEventListener('touchcancel', handleEnd);

        return () => {
            element.removeEventListener('touchstart', handleStart);
            element.removeEventListener('touchend', handleEnd);
            element.removeEventListener('touchcancel', handleEnd);
            clearTimeout(timeoutId);
        };
    }

    enableDragging(element, { onDragStart, onDrag, onDragEnd }) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === element) {
                isDragging = true;
                onDragStart?.({ x: initialX, y: initialY });
            }
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                onDrag?.({
                    x: currentX,
                    y: currentY,
                    deltaX: currentX - initialX,
                    deltaY: currentY - initialY
                });

                element.style.transform = 
                    `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        };

        const dragEnd = () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            onDragEnd?.({ x: currentX, y: currentY });
        };

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        return () => {
            element.removeEventListener('mousedown', dragStart);
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', dragEnd);
        };
    }

    storeEventListener(element, interaction, cleanup) {
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, new Map());
        }
        this.eventListeners.get(element).set(interaction, cleanup);
    }

    removeAllInteractions(element) {
        if (this.eventListeners.has(element)) {
            const listeners = this.eventListeners.get(element);
            listeners.forEach(cleanup => cleanup());
            this.eventListeners.delete(element);
        }

        if (this.gestureRecognizers.has(element)) {
            this.gestureRecognizers.get(element)();
            this.gestureRecognizers.delete(element);
        }
    }
} 