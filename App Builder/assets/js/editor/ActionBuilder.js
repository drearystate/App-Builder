class ActionBuilder {
    constructor(container) {
        this.container = container;
        this.actions = new Map();
        this.currentComponent = null;
        this.initializeBuilder();
    }

    initializeBuilder() {
        this.actionTypes = {
            navigation: {
                name: 'Navigation',
                actions: {
                    navigateToPage: {
                        name: 'Navigate to Page',
                        params: ['pageName'],
                        template: (params) => `Navigate to ${params.pageName}`
                    },
                    goBack: {
                        name: 'Go Back',
                        params: [],
                        template: () => 'Go back to previous page'
                    }
                }
            },
            data: {
                name: 'Data',
                actions: {
                    getData: {
                        name: 'Get Data',
                        params: ['collection', 'filter'],
                        template: (params) => `Get data from ${params.collection}`
                    },
                    setData: {
                        name: 'Set Data',
                        params: ['collection', 'data'],
                        template: (params) => `Set data in ${params.collection}`
                    },
                    updateData: {
                        name: 'Update Data',
                        params: ['collection', 'id', 'data'],
                        template: (params) => `Update item ${params.id} in ${params.collection}`
                    }
                }
            },
            component: {
                name: 'Component',
                actions: {
                    show: {
                        name: 'Show Component',
                        params: ['componentId'],
                        template: (params) => `Show component ${params.componentId}`
                    },
                    hide: {
                        name: 'Hide Component',
                        params: ['componentId'],
                        template: (params) => `Hide component ${params.componentId}`
                    },
                    toggle: {
                        name: 'Toggle Component',
                        params: ['componentId'],
                        template: (params) => `Toggle component ${params.componentId}`
                    }
                }
            },
            api: {
                name: 'API',
                actions: {
                    get: {
                        name: 'GET Request',
                        params: ['url', 'headers'],
                        template: (params) => `GET request to ${params.url}`
                    },
                    post: {
                        name: 'POST Request',
                        params: ['url', 'data', 'headers'],
                        template: (params) => `POST request to ${params.url}`
                    }
                }
            }
        };

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="action-builder">
                <div class="action-list"></div>
                <button class="add-action-btn">+ Add Action</button>
                <div class="action-modal" style="display: none;">
                    <div class="action-modal-content">
                        <h3>Add Action</h3>
                        <div class="action-categories"></div>
                        <div class="action-params"></div>
                        <div class="action-buttons">
                            <button class="cancel-btn">Cancel</button>
                            <button class="save-btn">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const addBtn = this.container.querySelector('.add-action-btn');
        addBtn.addEventListener('click', () => this.showActionModal());

        const cancelBtn = this.container.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.hideActionModal());

        const saveBtn = this.container.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.saveAction());
    }

    showActionModal() {
        const modal = this.container.querySelector('.action-modal');
        modal.style.display = 'block';
        this.renderActionCategories();
    }

    hideActionModal() {
        const modal = this.container.querySelector('.action-modal');
        modal.style.display = 'none';
    }

    renderActionCategories() {
        const container = this.container.querySelector('.action-categories');
        container.innerHTML = '';

        Object.entries(this.actionTypes).forEach(([category, config]) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'action-category';
            categoryEl.innerHTML = `
                <h4>${config.name}</h4>
                <div class="action-list">
                    ${Object.entries(config.actions).map(([actionId, action]) => `
                        <div class="action-item" data-category="${category}" data-action="${actionId}">
                            ${action.name}
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(categoryEl);
        });

        // Bind click events
        container.querySelectorAll('.action-item').forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                const actionId = item.dataset.action;
                this.showActionParams(category, actionId);
            });
        });
    }

    showActionParams(category, actionId) {
        const action = this.actionTypes[category].actions[actionId];
        const container = this.container.querySelector('.action-params');
        container.innerHTML = `
            <h4>Configure Action</h4>
            ${action.params.map(param => `
                <div class="param-item">
                    <label>${this.formatParamName(param)}</label>
                    <input type="text" name="${param}" placeholder="Enter ${param}">
                </div>
            `).join('')}
        `;
    }

    saveAction() {
        const params = {};
        this.container.querySelectorAll('.param-item input').forEach(input => {
            params[input.name] = input.value;
        });

        const actionItem = this.container.querySelector('.action-item.selected');
        const category = actionItem.dataset.category;
        const actionId = actionItem.dataset.action;

        this.actions.set(Date.now(), {
            category,
            actionId,
            params
        });

        this.hideActionModal();
        this.renderActionList();
    }

    renderActionList() {
        const container = this.container.querySelector('.action-list');
        container.innerHTML = '';

        this.actions.forEach((action, id) => {
            const actionConfig = this.actionTypes[action.category].actions[action.actionId];
            const actionEl = document.createElement('div');
            actionEl.className = 'action-list-item';
            actionEl.innerHTML = `
                <div class="action-content">
                    ${actionConfig.template(action.params)}
                </div>
                <div class="action-controls">
                    <button class="edit-btn" data-id="${id}">Edit</button>
                    <button class="delete-btn" data-id="${id}">Delete</button>
                </div>
            `;
            container.appendChild(actionEl);
        });

        // Bind edit/delete events
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editAction(btn.dataset.id));
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteAction(btn.dataset.id));
        });
    }

    editAction(id) {
        const action = this.actions.get(parseInt(id));
        this.showActionModal();
        // Pre-fill the form with existing values
        setTimeout(() => {
            const actionItem = this.container.querySelector(
                `.action-item[data-category="${action.category}"][data-action="${action.actionId}"]`
            );
            actionItem.click();
            Object.entries(action.params).forEach(([key, value]) => {
                const input = this.container.querySelector(`input[name="${key}"]`);
                if (input) input.value = value;
            });
        }, 0);
    }

    deleteAction(id) {
        this.actions.delete(parseInt(id));
        this.renderActionList();
    }

    formatParamName(param) {
        return param.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
} 