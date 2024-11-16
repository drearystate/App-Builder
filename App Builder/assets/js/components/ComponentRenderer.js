class ComponentRenderer {
    constructor() {
        this.componentInstances = new Map();
    }

    render(component, containerId) {
        const container = document.getElementById(containerId);
        const componentElement = this.createComponentElement(component);
        container.appendChild(componentElement);
        this.initializeComponent(component, componentElement);
        return componentElement;
    }

    createComponentElement(component) {
        const element = document.createElement('div');
        element.className = `app-component ${component.type}-component`;
        element.setAttribute('data-component-id', component.id);
        element.setAttribute('draggable', 'true');
        
        // Add component-specific content
        const content = this.getComponentContent(component);
        element.appendChild(content);

        // Add resize handles
        this.addResizeHandles(element);

        return element;
    }

    getComponentContent(component) {
        switch (component.type) {
            case 'button':
                return this.renderButton(component);
            case 'text':
                return this.renderText(component);
            case 'input':
                return this.renderInput(component);
            case 'navigationBar':
                return this.renderNavigationBar(component);
            // Add cases for all components...
            default:
                return document.createElement('div');
        }
    }

    // Component-specific render methods
    renderButton(component) {
        const button = document.createElement('button');
        button.className = `app-button ${component.properties.style}`;
        button.textContent = component.properties.text;
        
        if (component.properties.icon) {
            const icon = document.createElement('i');
            icon.className = `icon ${component.properties.icon}`;
            if (component.properties.iconPosition === 'left') {
                button.prepend(icon);
            } else {
                button.appendChild(icon);
            }
        }

        return button;
    }

    renderText(component) {
        const text = document.createElement('div');
        text.className = 'app-text';
        text.textContent = component.properties.content;
        return text;
    }

    renderInput(component) {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';

        if (component.properties.label) {
            const label = document.createElement('label');
            label.textContent = component.properties.label;
            wrapper.appendChild(label);
        }

        const input = document.createElement('input');
        input.type = component.properties.type;
        input.placeholder = component.properties.placeholder;
        input.required = component.properties.required;
        wrapper.appendChild(input);

        return wrapper;
    }

    renderNavigationBar(component) {
        const navbar = document.createElement('nav');
        navbar.className = 'app-navbar';

        if (component.properties.logo) {
            const logo = document.createElement('img');
            logo.src = component.properties.logo;
            logo.className = 'navbar-logo';
            navbar.appendChild(logo);
        }

        const menuItems = document.createElement('ul');
        component.properties.items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = item.label;
            if (item.icon) {
                const icon = document.createElement('i');
                icon.className = `icon ${item.icon}`;
                a.prepend(icon);
            }
            li.appendChild(a);
            menuItems.appendChild(li);
        });
        navbar.appendChild(menuItems);

        return navbar;
    }

    // Add resize handles to component
    addResizeHandles(element) {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${position}`;
            element.appendChild(handle);
        });
    }

    // Initialize component interactions
    initializeComponent(component, element) {
        this.initializeDrag(element);
        this.initializeResize(element);
        this.initializeComponentActions(component, element);
    }

    initializeDrag(element) {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', element.getAttribute('data-component-id'));
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }

    initializeResize(element) {
        const handles = element.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.startResize(e, element, handle.className.split(' ')[1]);
            });
        });
    }

    startResize(e, element, direction) {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;

        const resize = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (direction.includes('e')) {
                element.style.width = `${startWidth + deltaX}px`;
            }
            if (direction.includes('s')) {
                element.style.height = `${startHeight + deltaY}px`;
            }
            // Add other directions...
        };

        const stopResize = () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
        };

        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
    }

    initializeComponentActions(component, element) {
        // Initialize component-specific actions
        if (component.actions) {
            Object.entries(component.actions).forEach(([event, action]) => {
                element.addEventListener(event, (e) => {
                    this.executeAction(action, e);
                });
            });
        }
    }

    executeAction(action, event) {
        // Action execution logic here
        console.log('Executing action:', action, event);
    }
} 