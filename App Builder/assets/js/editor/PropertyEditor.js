class PropertyEditor {
    constructor(container) {
        this.container = container;
        this.currentComponent = null;
        this.changes = new Map();
        this.initializeEditor();
    }

    initializeEditor() {
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'property-editor';
        this.container.appendChild(this.editorContainer);
        
        // Create sections
        this.createSection('Layout');
        this.createSection('Style');
        this.createSection('Content');
        this.createSection('Actions');
    }

    createSection(title) {
        const section = document.createElement('div');
        section.className = 'property-section';
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h3>${title}</h3>
            <button class="toggle-section">▼</button>
        `;
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        section.appendChild(header);
        section.appendChild(content);
        this.editorContainer.appendChild(section);
        
        // Toggle functionality
        header.querySelector('.toggle-section').addEventListener('click', () => {
            content.classList.toggle('collapsed');
            header.querySelector('.toggle-section').textContent = 
                content.classList.contains('collapsed') ? '▶' : '▼';
        });
    }

    setComponent(component) {
        this.currentComponent = component;
        this.changes.clear();
        this.render();
    }

    render() {
        if (!this.currentComponent) return;

        const sections = {
            Layout: this.renderLayoutProperties.bind(this),
            Style: this.renderStyleProperties.bind(this),
            Content: this.renderContentProperties.bind(this),
            Actions: this.renderActionProperties.bind(this)
        };

        Object.entries(sections).forEach(([sectionName, renderFunction]) => {
            const section = this.editorContainer.querySelector(
                `.property-section:has(h3:contains('${sectionName}')) .section-content`
            );
            section.innerHTML = '';
            renderFunction(section);
        });
    }

    renderLayoutProperties(container) {
        const properties = [
            {
                name: 'position',
                type: 'group',
                properties: [
                    { name: 'x', type: 'number' },
                    { name: 'y', type: 'number' }
                ]
            },
            {
                name: 'size',
                type: 'group',
                properties: [
                    { name: 'width', type: 'number' },
                    { name: 'height', type: 'number' }
                ]
            },
            {
                name: 'margin',
                type: 'spacing'
            },
            {
                name: 'padding',
                type: 'spacing'
            }
        ];

        properties.forEach(prop => this.renderProperty(container, prop));
    }

    renderStyleProperties(container) {
        const properties = [
            {
                name: 'background',
                type: 'color'
            },
            {
                name: 'border',
                type: 'border'
            },
            {
                name: 'shadow',
                type: 'shadow'
            },
            {
                name: 'opacity',
                type: 'slider',
                min: 0,
                max: 1,
                step: 0.1
            }
        ];

        properties.forEach(prop => this.renderProperty(container, prop));
    }

    renderContentProperties(container) {
        // Render component-specific properties
        const componentProps = this.currentComponent.getProperties();
        Object.entries(componentProps).forEach(([key, config]) => {
            this.renderProperty(container, {
                name: key,
                ...config
            });
        });
    }

    renderActionProperties(container) {
        const actionList = document.createElement('div');
        actionList.className = 'action-list';
        
        // Add existing actions
        this.currentComponent.actions.forEach((action, event) => {
            const actionItem = this.createActionItem(event, action);
            actionList.appendChild(actionItem);
        });
        
        // Add new action button
        const addButton = document.createElement('button');
        addButton.className = 'add-action-button';
        addButton.textContent = '+ Add Action';
        addButton.addEventListener('click', () => this.showActionDialog());
        
        container.appendChild(actionList);
        container.appendChild(addButton);
    }

    renderProperty(container, property) {
        const wrapper = document.createElement('div');
        wrapper.className = 'property-item';
        
        const label = document.createElement('label');
        label.textContent = this.formatLabel(property.name);
        
        const input = this.createPropertyInput(property);
        
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }

    createPropertyInput(property) {
        switch (property.type) {
            case 'string':
                return this.createTextInput(property);
            case 'number':
                return this.createNumberInput(property);
            case 'color':
                return this.createColorInput(property);
            case 'select':
                return this.createSelectInput(property);
            case 'spacing':
                return this.createSpacingInput(property);
            case 'border':
                return this.createBorderInput(property);
            case 'shadow':
                return this.createShadowInput(property);
            case 'slider':
                return this.createSliderInput(property);
            default:
                return this.createTextInput(property);
        }
    }

    createTextInput(property) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, e.target.value);
        });
        return input;
    }

    createNumberInput(property) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, parseFloat(e.target.value));
        });
        return input;
    }

    createBooleanInput(property) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, e.target.checked);
        });
        return input;
    }

    createSelectInput(property) {
        const select = document.createElement('select');
        select.value = this.getCurrentValue(property.name);
        property.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        select.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, e.target.value);
        });
        return select;
    }

    createColorInput(property) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, e.target.value);
        });
        return input;
    }

    createSpacingInput(property) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, parseFloat(e.target.value));
        });
        return input;
    }

    createBorderInput(property) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, parseFloat(e.target.value));
        });
        return input;
    }

    createShadowInput(property) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, parseFloat(e.target.value));
        });
        return input;
    }

    createSliderInput(property) {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = property.min;
        input.max = property.max;
        input.step = property.step;
        input.value = this.getCurrentValue(property.name);
        input.addEventListener('change', (e) => {
            this.handlePropertyChange(property.name, parseFloat(e.target.value));
        });
        return input;
    }

    handlePropertyChange(propertyName, value) {
        this.changes.set(propertyName, value);
        this.emitChange();
    }

    emitChange() {
        const event = new CustomEvent('propertychange', {
            detail: {
                component: this.currentComponent,
                changes: Object.fromEntries(this.changes)
            }
        });
        this.container.dispatchEvent(event);
    }

    formatLabel(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    getCurrentValue(propertyName) {
        return this.changes.has(propertyName) 
            ? this.changes.get(propertyName)
            : this.currentComponent.getProperty(propertyName);
    }
} 