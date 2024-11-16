class ComponentLibrary {
    constructor() {
        this.categories = {
            basic: {
                name: "Basic Elements",
                components: {}
            },
            layout: {
                name: "Layout",
                components: {}
            },
            navigation: {
                name: "Navigation",
                components: {}
            },
            forms: {
                name: "Forms",
                components: {}
            },
            data: {
                name: "Data Display",
                components: {}
            },
            media: {
                name: "Media",
                components: {}
            },
            advanced: {
                name: "Advanced",
                components: {}
            }
        };
        this.initializeComponents();
    }

    initializeComponents() {
        // BASIC ELEMENTS
        this.registerComponent('text', {
            category: 'basic',
            name: 'Text',
            icon: 'text-icon.svg',
            properties: {
                content: { type: 'string', default: 'Text content' },
                fontSize: { type: 'number', default: 16 },
                fontWeight: { 
                    type: 'select', 
                    options: ['normal', 'bold', 'light'],
                    default: 'normal'
                },
                color: { type: 'color', default: '#000000' },
                alignment: {
                    type: 'select',
                    options: ['left', 'center', 'right'],
                    default: 'left'
                },
                fontFamily: { type: 'string', default: 'Arial' }
            }
        });

        this.registerComponent('button', {
            category: 'basic',
            name: 'Button',
            icon: 'button-icon.svg',
            properties: {
                text: { type: 'string', default: 'Click me' },
                style: {
                    type: 'select',
                    options: ['primary', 'secondary', 'outline', 'text'],
                    default: 'primary'
                },
                size: {
                    type: 'select',
                    options: ['small', 'medium', 'large'],
                    default: 'medium'
                },
                borderRadius: { type: 'number', default: 4 },
                disabled: { type: 'boolean', default: false },
                fullWidth: { type: 'boolean', default: false },
                icon: { type: 'icon', default: null },
                iconPosition: {
                    type: 'select',
                    options: ['left', 'right'],
                    default: 'left'
                }
            },
            actions: {
                onClick: { type: 'action', params: [] },
                onHover: { type: 'action', params: [] }
            }
        });

        this.registerComponent('image', {
            category: 'basic',
            name: 'Image',
            icon: 'image-icon.svg',
            properties: {
                source: { type: 'image', default: '' },
                altText: { type: 'string', default: '' },
                fit: {
                    type: 'select',
                    options: ['contain', 'cover', 'fill', 'none'],
                    default: 'cover'
                },
                borderRadius: { type: 'number', default: 0 },
                shadow: { type: 'boolean', default: false },
                clickable: { type: 'boolean', default: false }
            },
            actions: {
                onClick: { type: 'action', params: [] },
                onLoad: { type: 'action', params: [] },
                onError: { type: 'action', params: [] }
            }
        });

        this.registerComponent('icon', {
            category: 'basic',
            name: 'Icon',
            icon: 'icon-icon.svg',
            properties: {
                name: { 
                    type: 'iconPicker',
                    default: 'home'
                },
                size: { type: 'number', default: 24 },
                color: { type: 'color', default: '#000000' },
                clickable: { type: 'boolean', default: false }
            },
            actions: {
                onClick: { type: 'action', params: [] }
            }
        });

        this.registerComponent('link', {
            category: 'basic',
            name: 'Link',
            icon: 'link-icon.svg',
            properties: {
                text: { type: 'string', default: 'Click here' },
                url: { type: 'string', default: '#' },
                color: { type: 'color', default: '#0066cc' },
                underline: {
                    type: 'select',
                    options: ['always', 'hover', 'none'],
                    default: 'hover'
                },
                openInNewTab: { type: 'boolean', default: false }
            },
            actions: {
                onClick: { type: 'action', params: [] }
            }
        });

        this.registerComponent('divider', {
            category: 'basic',
            name: 'Divider',
            icon: 'divider-icon.svg',
            properties: {
                orientation: {
                    type: 'select',
                    options: ['horizontal', 'vertical'],
                    default: 'horizontal'
                },
                thickness: { type: 'number', default: 1 },
                color: { type: 'color', default: '#e0e0e0' },
                style: {
                    type: 'select',
                    options: ['solid', 'dashed', 'dotted'],
                    default: 'solid'
                },
                margin: { type: 'number', default: 16 }
            }
        });

        // LAYOUT COMPONENTS
        this.registerComponent('container', {
            category: 'layout',
            name: 'Container',
            icon: 'container-icon.svg',
            properties: {
                width: { type: 'string', default: '100%' },
                maxWidth: { type: 'string', default: '1200px' },
                padding: {
                    type: 'object',
                    properties: {
                        top: { type: 'number', default: 16 },
                        right: { type: 'number', default: 16 },
                        bottom: { type: 'number', default: 16 },
                        left: { type: 'number', default: 16 }
                    }
                },
                margin: {
                    type: 'object',
                    properties: {
                        top: { type: 'number', default: 0 },
                        right: { type: 'number', default: 0 },
                        bottom: { type: 'number', default: 0 },
                        left: { type: 'number', default: 0 }
                    }
                },
                backgroundColor: { type: 'color', default: '#ffffff' },
                borderRadius: { type: 'number', default: 0 },
                shadow: {
                    type: 'select',
                    options: ['none', 'small', 'medium', 'large'],
                    default: 'none'
                },
                overflow: {
                    type: 'select',
                    options: ['visible', 'hidden', 'scroll', 'auto'],
                    default: 'visible'
                }
            }
        });

        this.registerComponent('stack', {
            category: 'layout',
            name: 'Stack',
            icon: 'stack-icon.svg',
            properties: {
                spacing: { type: 'number', default: 16 },
                alignment: {
                    type: 'select',
                    options: ['start', 'center', 'end', 'stretch'],
                    default: 'start'
                },
                distribution: {
                    type: 'select',
                    options: ['start', 'center', 'end', 'space-between', 'space-around'],
                    default: 'start'
                },
                padding: { type: 'number', default: 0 },
                backgroundColor: { type: 'color', default: 'transparent' }
            }
        });

        this.registerComponent('row', {
            category: 'layout',
            name: 'Row',
            icon: 'row-icon.svg',
            properties: {
                spacing: { type: 'number', default: 16 },
                alignment: {
                    type: 'select',
                    options: ['start', 'center', 'end', 'stretch'],
                    default: 'center'
                },
                distribution: {
                    type: 'select',
                    options: ['start', 'center', 'end', 'space-between', 'space-around'],
                    default: 'start'
                },
                wrap: { type: 'boolean', default: true },
                padding: { type: 'number', default: 0 },
                backgroundColor: { type: 'color', default: 'transparent' }
            }
        });

        // NAVIGATION COMPONENTS
        this.registerComponent('navigationBar', {
            category: 'navigation',
            name: 'Navigation Bar',
            icon: 'navbar-icon.svg',
            properties: {
                position: {
                    type: 'select',
                    options: ['fixed', 'sticky', 'static'],
                    default: 'fixed'
                },
                backgroundColor: { type: 'color', default: '#ffffff' },
                height: { type: 'number', default: 60 },
                shadow: { type: 'boolean', default: true },
                logo: { type: 'image', default: null },
                logoSize: { type: 'number', default: 40 },
                items: {
                    type: 'array',
                    itemType: 'object',
                    properties: {
                        label: { type: 'string' },
                        link: { type: 'string' },
                        icon: { type: 'icon' }
                    }
                }
            }
        });

        this.registerComponent('menu', {
            category: 'navigation',
            name: 'Menu',
            icon: 'menu-icon.svg',
            properties: {
                type: {
                    type: 'select',
                    options: ['dropdown', 'context', 'sidebar'],
                    default: 'dropdown'
                },
                items: {
                    type: 'array',
                    itemType: 'object',
                    properties: {
                        label: { type: 'string' },
                        icon: { type: 'icon' },
                        subItems: { type: 'array' }
                    }
                },
                width: { type: 'number', default: 200 },
                backgroundColor: { type: 'color', default: '#ffffff' },
                textColor: { type: 'color', default: '#000000' },
                hoverColor: { type: 'color', default: '#f5f5f5' }
            },
            actions: {
                onSelect: { type: 'action', params: ['item'] }
            }
        });

        this.registerComponent('sidebar', {
            category: 'navigation',
            name: 'Sidebar',
            icon: 'sidebar-icon.svg',
            properties: {
                position: {
                    type: 'select',
                    options: ['left', 'right'],
                    default: 'left'
                },
                width: { type: 'number', default: 250 },
                collapsible: { type: 'boolean', default: true },
                collapsedWidth: { type: 'number', default: 60 },
                backgroundColor: { type: 'color', default: '#ffffff' },
                items: {
                    type: 'array',
                    itemType: 'object',
                    properties: {
                        label: { type: 'string' },
                        icon: { type: 'icon' },
                        link: { type: 'string' }
                    }
                }
            }
        });

        // FORM COMPONENTS
        this.registerComponent('input', {
            category: 'forms',
            name: 'Input Field',
            icon: 'input-icon.svg',
            properties: {
                label: { type: 'string', default: 'Label' },
                placeholder: { type: 'string', default: 'Enter text...' },
                type: {
                    type: 'select',
                    options: ['text', 'email', 'password', 'number', 'tel', 'url'],
                    default: 'text'
                },
                required: { type: 'boolean', default: false },
                validation: {
                    type: 'object',
                    properties: {
                        pattern: { type: 'string' },
                        minLength: { type: 'number' },
                        maxLength: { type: 'number' }
                    }
                },
                errorMessage: { type: 'string', default: 'Please enter a valid value' },
                helper: { type: 'string', default: '' }
            },
            actions: {
                onChange: { type: 'action', params: ['value'] },
                onFocus: { type: 'action', params: [] },
                onBlur: { type: 'action', params: [] }
            }
        });

        this.registerComponent('textArea', {
            category: 'forms',
            name: 'Text Area',
            icon: 'textarea-icon.svg',
            properties: {
                label: { type: 'string', default: 'Label' },
                placeholder: { type: 'string', default: 'Enter text...' },
                rows: { type: 'number', default: 4 },
                maxLength: { type: 'number', default: 500 },
                resizable: { type: 'boolean', default: true },
                required: { type: 'boolean', default: false }
            },
            actions: {
                onChange: { type: 'action', params: ['value'] },
                onFocus: { type: 'action', params: [] },
                onBlur: { type: 'action', params: [] }
            }
        });

        // DATA DISPLAY COMPONENTS
        this.registerComponent('table', {
            category: 'data',
            name: 'Table',
            icon: 'table-icon.svg',
            properties: {
                columns: {
                    type: 'array',
                    itemType: 'object',
                    properties: {
                        title: { type: 'string' },
                        field: { type: 'string' },
                        width: { type: 'string' },
                        sortable: { type: 'boolean' }
                    }
                },
                data: { type: 'array', default: [] },
                pagination: { type: 'boolean', default: true },
                rowsPerPage: { type: 'number', default: 10 },
                selectable: { type: 'boolean', default: false },
                searchable: { type: 'boolean', default: true },
                bordered: { type: 'boolean', default: true },
                striped: { type: 'boolean', default: false }
            },
            actions: {
                onRowClick: { type: 'action', params: ['row'] },
                onSort: { type: 'action', params: ['column', 'direction'] },
                onSelectionChange: { type: 'action', params: ['selectedRows'] }
            }
        });

        this.registerComponent('chart', {
            category: 'data',
            name: 'Chart',
            icon: 'chart-icon.svg',
            properties: {
                type: {
                    type: 'select',
                    options: ['line', 'bar', 'pie', 'doughnut', 'area'],
                    default: 'line'
                },
                data: {
                    type: 'object',
                    properties: {
                        labels: { type: 'array' },
                        datasets: { type: 'array' }
                    }
                },
                options: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        legend: { type: 'boolean' },
                        animations: { type: 'boolean' }
                    }
                },
                height: { type: 'number', default: 300 }
            }
        });

        // MEDIA COMPONENTS
        this.registerComponent('videoPlayer', {
            category: 'media',
            name: 'Video Player',
            icon: 'video-icon.svg',
            properties: {
                source: { type: 'string', default: '' },
                poster: { type: 'image', default: '' },
                autoplay: { type: 'boolean', default: false },
                controls: { type: 'boolean', default: true },
                loop: { type: 'boolean', default: false },
                muted: { type: 'boolean', default: false },
                width: { type: 'string', default: '100%' },
                height: { type: 'string', default: 'auto' }
            },
            actions: {
                onPlay: { type: 'action', params: [] },
                onPause: { type: 'action', params: [] },
                onEnd: { type: 'action', params: [] }
            }
        });

        // ADVANCED COMPONENTS
        this.registerComponent('modal', {
            category: 'advanced',
            name: 'Modal',
            icon: 'modal-icon.svg',
            properties: {
                title: { type: 'string', default: 'Modal Title' },
                size: {
                    type: 'select',
                    options: ['small', 'medium', 'large', 'full'],
                    default: 'medium'
                },
                closeOnClickOutside: { type: 'boolean', default: true },
                showCloseButton: { type: 'boolean', default: true },
                animation: {
                    type: 'select',
                    options: ['fade', 'slide', 'scale'],
                    default: 'fade'
                }
            },
            actions: {
                onOpen: { type: 'action', params: [] },
                onClose: { type: 'action', params: [] }
            }
        });

        this.registerComponent('toast', {
            category: 'advanced',
            name: 'Toast Notification',
            icon: 'toast-icon.svg',
            properties: {
                type: {
                    type: 'select',
                    options: ['success', 'error', 'warning', 'info'],
                    default: 'info'
                },
                message: { type: 'string', default: 'Notification message' },
                duration: { type: 'number', default: 3000 },
                position: {
                    type: 'select',
                    options: [
                        'top-right', 'top-left', 'top-center',
                        'bottom-right', 'bottom-left', 'bottom-center'
                    ],
                    default: 'top-right'
                },
                showIcon: { type: 'boolean', default: true },
                showCloseButton: { type: 'boolean', default: true }
            },
            actions: {
                onShow: { type: 'action', params: [] },
                onClose: { type: 'action', params: [] }
            }
        });

        this.registerComponent('calendar', {
            category: 'advanced',
            name: 'Calendar',
            icon: 'calendar-icon.svg',
            properties: {
                view: {
                    type: 'select',
                    options: ['month', 'week', 'day'],
                    default: 'month'
                },
                events: {
                    type: 'array',
                    itemType: 'object',
                    properties: {
                        title: { type: 'string' },
                        start: { type: 'date' },
                        end: { type: 'date' },
                        color: { type: 'color' }
                    }
                },
                firstDayOfWeek: {
                    type: 'select',
                    options: ['sunday', 'monday'],
                    default: 'sunday'
                },
                showWeekNumbers: { type: 'boolean', default: false }
            },
            actions: {
                onEventClick: { type: 'action', params: ['event'] },
                onDateSelect: { type: 'action', params: ['date'] },
                onViewChange: { type: 'action', params: ['view'] }
            }
        });
    }

    registerComponent(id, config) {
        this.categories[config.category].components[id] = {
            id,
            ...config
        };
    }
} 