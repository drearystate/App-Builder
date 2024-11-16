class LayoutManager {
    constructor() {
        this.layouts = new Map();
        this.gridSystem = new GridSystem();
        this.constraints = new LayoutConstraints();
        this.responsiveBreakpoints = new Map();
        this.activeLayout = null;
        this.observers = new Set();
        this.initializeLayoutSystem();
    }

    initializeLayoutSystem() {
        this.setupDefaultBreakpoints();
        this.setupDefaultLayouts();
        this.setupResizeObserver();
        this.setupMutationObserver();
    }

    setupDefaultBreakpoints() {
        this.setBreakpoints({
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        });
    }

    setupDefaultLayouts() {
        // Grid layouts
        this.registerLayout('grid-12', {
            type: 'grid',
            columns: 12,
            gap: '1rem',
            rowGap: '1rem',
            responsive: true
        });

        // Flexbox layouts
        this.registerLayout('flex-container', {
            type: 'flex',
            direction: 'row',
            wrap: 'wrap',
            justify: 'flex-start',
            align: 'stretch'
        });

        // Responsive layouts
        this.registerLayout('responsive-container', {
            type: 'responsive',
            breakpoints: {
                xs: { columns: 1, gap: '0.5rem' },
                sm: { columns: 2, gap: '0.75rem' },
                md: { columns: 3, gap: '1rem' },
                lg: { columns: 4, gap: '1.25rem' }
            }
        });
    }

    registerLayout(name, config) {
        this.layouts.set(name, {
            id: `layout-${Date.now()}`,
            name,
            config,
            elements: new Set()
        });
    }

    applyLayout(element, layoutName, options = {}) {
        const layout = this.layouts.get(layoutName);
        if (!layout) throw new Error(`Layout '${layoutName}' not found`);

        const layoutConfig = { ...layout.config, ...options };
        
        switch (layoutConfig.type) {
            case 'grid':
                this.applyGridLayout(element, layoutConfig);
                break;
            case 'flex':
                this.applyFlexLayout(element, layoutConfig);
                break;
            case 'responsive':
                this.applyResponsiveLayout(element, layoutConfig);
                break;
            default:
                throw new Error(`Unknown layout type: ${layoutConfig.type}`);
        }

        layout.elements.add(element);
        this.activeLayout = layout;
        this.notifyLayoutChange(element, layoutConfig);
    }

    applyGridLayout(element, config) {
        element.style.display = 'grid';
        element.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
        element.style.gap = config.gap;
        element.style.rowGap = config.rowGap;

        if (config.areas) {
            element.style.gridTemplateAreas = config.areas;
        }

        if (config.responsive) {
            this.applyResponsiveGrid(element, config);
        }
    }

    applyFlexLayout(element, config) {
        element.style.display = 'flex';
        element.style.flexDirection = config.direction;
        element.style.flexWrap = config.wrap;
        element.style.justifyContent = config.justify;
        element.style.alignItems = config.align;

        if (config.gap) {
            element.style.gap = config.gap;
        }
    }

    applyResponsiveLayout(element, config) {
        const breakpoints = Object.entries(config.breakpoints);
        
        breakpoints.forEach(([breakpoint, settings]) => {
            const minWidth = this.responsiveBreakpoints.get(breakpoint);
            
            const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);
            const updateLayout = (e) => {
                if (e.matches) {
                    this.updateElementLayout(element, settings);
                }
            };

            mediaQuery.addListener(updateLayout);
            updateLayout(mediaQuery);
        });
    }

    updateElementLayout(element, settings) {
        Object.entries(settings).forEach(([property, value]) => {
            switch (property) {
                case 'columns':
                    element.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
                    break;
                case 'gap':
                    element.style.gap = value;
                    break;
                // Add more properties as needed
            }
        });
    }

    setBreakpoints(breakpoints) {
        this.responsiveBreakpoints = new Map(Object.entries(breakpoints));
        this.updateResponsiveLayouts();
    }

    updateResponsiveLayouts() {
        this.layouts.forEach(layout => {
            if (layout.config.type === 'responsive') {
                layout.elements.forEach(element => {
                    this.applyResponsiveLayout(element, layout.config);
                });
            }
        });
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const element = entry.target;
                const layout = this.findLayoutForElement(element);
                
                if (layout && layout.config.responsive) {
                    this.handleElementResize(element, entry.contentRect);
                }
            });
        });
    }

    setupMutationObserver() {
        this.mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleChildrenChange(mutation.target);
                }
            });
        });
    }

    handleElementResize(element, contentRect) {
        const layout = this.findLayoutForElement(element);
        if (!layout) return;

        // Update layout based on new size
        this.updateLayoutForSize(element, layout, contentRect);
    }

    updateLayoutForSize(element, layout, contentRect) {
        const { width } = contentRect;
        const breakpoints = Array.from(this.responsiveBreakpoints.entries())
            .sort((a, b) => b[1] - a[1]);

        for (const [breakpoint, minWidth] of breakpoints) {
            if (width >= minWidth) {
                const settings = layout.config.breakpoints[breakpoint];
                if (settings) {
                    this.updateElementLayout(element, settings);
                }
                break;
            }
        }
    }

    findLayoutForElement(element) {
        for (const layout of this.layouts.values()) {
            if (layout.elements.has(element)) {
                return layout;
            }
        }
        return null;
    }

    removeLayout(element) {
        const layout = this.findLayoutForElement(element);
        if (layout) {
            layout.elements.delete(element);
            element.style.display = '';
            element.style.gridTemplateColumns = '';
            element.style.gap = '';
            // Reset other layout properties
        }
    }

    addLayoutObserver(callback) {
        this.observers.add(callback);
    }

    removeLayoutObserver(callback) {
        this.observers.delete(callback);
    }

    notifyLayoutChange(element, config) {
        this.observers.forEach(observer => {
            observer({
                element,
                layout: config,
                timestamp: Date.now()
            });
        });
    }

    getLayoutInfo(element) {
        const layout = this.findLayoutForElement(element);
        if (!layout) return null;

        return {
            name: layout.name,
            config: layout.config,
            computed: {
                display: getComputedStyle(element).display,
                gridTemplate: getComputedStyle(element).gridTemplateColumns,
                gap: getComputedStyle(element).gap
            }
        };
    }

    cleanup() {
        this.resizeObserver.disconnect();
        this.mutationObserver.disconnect();
        this.layouts.clear();
        this.observers.clear();
    }
}

// Helper class for Grid System
class GridSystem {
    constructor() {
        this.gridTemplates = new Map();
        this.initializeDefaultTemplates();
    }

    initializeDefaultTemplates() {
        this.addTemplate('standard', {
            columns: 12,
            rows: 'auto',
            gap: '1rem'
        });

        this.addTemplate('dashboard', {
            areas: [
                'header header header',
                'sidebar main main',
                'footer footer footer'
            ],
            columns: '200px 1fr 1fr',
            rows: 'auto 1fr auto'
        });
    }

    addTemplate(name, config) {
        this.gridTemplates.set(name, config);
    }

    getTemplate(name) {
        return this.gridTemplates.get(name);
    }
}

// Helper class for Layout Constraints
class LayoutConstraints {
    constructor() {
        this.constraints = new Map();
    }

    addConstraint(element, config) {
        this.constraints.set(element, config);
        this.applyConstraints(element);
    }

    applyConstraints(element) {
        const config = this.constraints.get(element);
        if (!config) return;

        if (config.minWidth) element.style.minWidth = config.minWidth;
        if (config.maxWidth) element.style.maxWidth = config.maxWidth;
        if (config.minHeight) element.style.minHeight = config.minHeight;
        if (config.maxHeight) element.style.maxHeight = config.maxHeight;
    }

    removeConstraints(element) {
        this.constraints.delete(element);
        element.style.minWidth = '';
        element.style.maxWidth = '';
        element.style.minHeight = '';
        element.style.maxHeight = '';
    }
} 