class Canvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.components = [];
        this.selectedComponent = null;
        this.init();
    }

    init() {
        this.container.addEventListener('dragover', this.handleDragOver.bind(this));
        this.container.addEventListener('drop', this.handleDrop.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('component');
        const x = e.clientX - this.container.offsetLeft;
        const y = e.clientY - this.container.offsetTop;
        
        this.addComponent(componentType, x, y);
    }

    addComponent(type, x, y) {
        const component = {
            id: Date.now(),
            type: type,
            x: x,
            y: y,
            width: 100,
            height: 100,
            properties: {}
        };

        this.components.push(component);
        this.renderComponent(component);
    }

    renderComponent(component) {
        const element = document.createElement('div');
        element.className = 'canvas-component';
        element.setAttribute('data-id', component.id);
        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;
        element.style.width = `${component.width}px`;
        element.style.height = `${component.height}px`;
        
        // Make component draggable
        element.draggable = true;
        element.addEventListener('dragstart', this.handleComponentDragStart.bind(this));
        
        this.container.appendChild(element);
    }

    handleComponentDragStart(e) {
        this.selectedComponent = e.target;
    }
} 