class PreviewMode {
    constructor(stateManager, container) {
        this.stateManager = stateManager;
        this.container = container;
        this.isPreviewMode = false;
        this.savedState = null;
        
        this.initializePreview();
    }

    initializePreview() {
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'preview-container';
        this.container.appendChild(this.previewContainer);
        
        this.toolbar = this.createToolbar();
        this.container.appendChild(this.toolbar);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'preview-toolbar';
        
        // Device selection
        const deviceSelect = document.createElement('select');
        deviceSelect.innerHTML = `
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
        `;
        deviceSelect.addEventListener('change', (e) => this.changeDevice(e.target.value));
        
        // Preview toggle
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Preview';
        toggleButton.addEventListener('click', () => this.togglePreview());
        
        toolbar.appendChild(deviceSelect);
        toolbar.appendChild(toggleButton);
        
        return toolbar;
    }

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        
        if (this.isPreviewMode) {
            this.enterPreviewMode();
        } else {
            this.exitPreviewMode();
        }
    }

    enterPreviewMode() {
        // Save current state
        this.savedState = this.stateManager.serializeState();
        
        // Hide editor UI
        this.container.classList.add('preview-mode');
        
        // Render components in preview mode
        this.renderPreview();
        
        // Enable component interactions
        this.enableInteractions();
    }

    exitPreviewMode() {
        // Restore saved state
        if (this.savedState) {
            this.stateManager.restoreState({ state: this.savedState });
        }
        
        // Show editor UI
        this.container.classList.remove('preview-mode');
        
        // Clean up preview
        this.previewContainer.innerHTML = '';
        
        // Disable component interactions
        this.disableInteractions();
    }

    renderPreview() {
        this.previewContainer.innerHTML = '';
        
        // Render components in preview mode
        this.stateManager.state.components.forEach(component => {
            const elementContainer = document.createElement('div');
            elementContainer.className = 'preview-component';
            elementContainer.setAttribute('data-component-id', component.id);
            
            // Render component content
            const content = this.renderComponent(component);
            elementContainer.appendChild(content);
            
            this.previewContainer.appendChild(elementContainer);
        });
    }

    renderComponent(component) {
        // Create component instance based on type
        const element = document.createElement('div');
        element.className = `component-${component.type}`;
        
        // Apply component properties
        Object.entries(component.properties).forEach(([key, value]) => {
            this.applyProperty(element, key, value);
        });
        
        return element;
    }

    applyProperty(element, key, value) {
        switch (key) {
            case 'text':
                element.textContent = value;
                break;
            case 'backgroundColor':
                element.style.backgroundColor = value;
                break;
            case 'color':
                element.style.color = value;
                break;
            // Add more property handlers
        }
    }

    enableInteractions() {
        this.stateManager.state.components.forEach(component => {
            const element = this.previewContainer.querySelector(
                `[data-component-id="${component.id}"]`
            );
            
            if (element) {
                this.attachEventHandlers(element, component);
            }
        });
    }

    attachEventHandlers(element, component) {
        // Attach registered event handlers
        const events = this.stateManager.eventSystem.getAvailableEvents(component.type);
        events.forEach(eventType => {
            element.addEventListener(eventType, (event) => {
                this.stateManager.eventSystem.triggerEvent(
                    component.id,
                    eventType,
                    { event, component }
                );
            });
        });
    }

    disableInteractions() {
        // Remove all event listeners
        const elements = this.previewContainer.querySelectorAll('[data-component-id]');
        elements.forEach(element => {
            element.replaceWith(element.cloneNode(true));
        });
    }

    changeDevice(deviceType) {
        const deviceSizes = {
            mobile: { width: 375, height: 667 },
            tablet: { width: 768, height: 1024 },
            desktop: { width: 1280, height: 800 }
        };
        
        const size = deviceSizes[deviceType];
        this.previewContainer.style.width = `${size.width}px`;
        this.previewContainer.style.height = `${size.height}px`;
        
        this.renderPreview();
    }
} 