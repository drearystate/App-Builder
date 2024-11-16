class DragDropManager {
    constructor(canvas, componentLibrary) {
        this.canvas = canvas;
        this.componentLibrary = componentLibrary;
        this.draggedElement = null;
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Canvas event listeners
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
        
        // Component palette event listeners
        document.querySelectorAll('.component-palette-item').forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Grid snapping
        this.gridSize = 10; // pixels
    }

    handleDragStart(e) {
        this.isDragging = true;
        const componentType = e.target.getAttribute('data-component-type');
        e.dataTransfer.setData('component-type', componentType);
        
        // Create ghost image
        const ghost = e.target.cloneNode(true);
        ghost.classList.add('dragging-ghost');
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        
        // Calculate offset
        const rect = e.target.getBoundingClientRect();
        this.offset.x = e.clientX - rect.left;
        this.offset.y = e.clientY - rect.top;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        // Show drop indicator
        this.showDropIndicator(e.clientX, e.clientY);
    }

    handleDrop(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('component-type');
        
        // Calculate position with grid snapping
        const x = this.snapToGrid(e.clientX - this.canvas.offsetLeft - this.offset.x);
        const y = this.snapToGrid(e.clientY - this.canvas.offsetTop - this.offset.y);
        
        this.createComponent(componentType, x, y);
        this.hideDropIndicator();
    }

    handleDragEnd() {
        this.isDragging = false;
        this.hideDropIndicator();
        // Remove ghost image
        document.querySelectorAll('.dragging-ghost').forEach(ghost => ghost.remove());
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    showDropIndicator(x, y) {
        if (!this.dropIndicator) {
            this.dropIndicator = document.createElement('div');
            this.dropIndicator.className = 'drop-indicator';
            this.canvas.appendChild(this.dropIndicator);
        }
        
        const snappedX = this.snapToGrid(x - this.canvas.offsetLeft);
        const snappedY = this.snapToGrid(y - this.canvas.offsetTop);
        
        this.dropIndicator.style.left = `${snappedX}px`;
        this.dropIndicator.style.top = `${snappedY}px`;
    }

    hideDropIndicator() {
        if (this.dropIndicator) {
            this.dropIndicator.remove();
            this.dropIndicator = null;
        }
    }

    createComponent(type, x, y) {
        const component = this.componentLibrary.createComponent(type);
        component.position = { x, y };
        return this.canvas.addComponent(component);
    }
} 