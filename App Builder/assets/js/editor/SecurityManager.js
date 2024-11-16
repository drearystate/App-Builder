class SecurityManager {
    constructor() {
        this.permissions = new Map();
        this.roles = new Map();
        this.policies = new Map();
        this.currentUser = null;
        this.securityContext = new Map();
        this.initializeSecurity();
    }

    initializeSecurity() {
        this.setupDefaultRoles();
        this.setupDefaultPolicies();
        this.setupSecurityMiddleware();
        this.initializeCSRFProtection();
    }

    setupDefaultRoles() {
        this.addRole('admin', {
            permissions: ['*'],
            description: 'Full system access'
        });

        this.addRole('editor', {
            permissions: ['read', 'write', 'update'],
            description: 'Can edit content'
        });

        this.addRole('viewer', {
            permissions: ['read'],
            description: 'Read-only access'
        });
    }

    setupDefaultPolicies() {
        // Content access policy
        this.addPolicy('content-access', (user, resource) => {
            if (this.hasRole(user, 'admin')) return true;
            if (resource.ownerId === user.id) return true;
            if (this.hasRole(user, 'editor') && resource.type === 'content') return true;
            if (this.hasRole(user, 'viewer') && resource.isPublic) return true;
            return false;
        });

        // Data modification policy
        this.addPolicy('data-modification', (user, resource) => {
            if (this.hasRole(user, 'admin')) return true;
            if (resource.ownerId === user.id) return true;
            if (this.hasRole(user, 'editor') && resource.type === 'content') return true;
            return false;
        });
    }

    setupSecurityMiddleware() {
        // Input sanitization
        this.addMiddleware('sanitize-input', (data) => {
            if (typeof data === 'string') {
                return this.sanitizeString(data);
            }
            if (typeof data === 'object') {
                return this.sanitizeObject(data);
            }
            return data;
        });

        // Output encoding
        this.addMiddleware('encode-output', (data) => {
            if (typeof data === 'string') {
                return this.encodeHTML(data);
            }
            return data;
        });
    }

    initializeCSRFProtection() {
        this.csrfToken = this.generateCSRFToken();
        this.setupCSRFHeaders();
    }

    addRole(roleName, roleConfig) {
        this.roles.set(roleName, roleConfig);
    }

    addPolicy(policyName, policyFn) {
        this.policies.set(policyName, policyFn);
    }

    addPermission(permissionName, permissionConfig) {
        this.permissions.set(permissionName, permissionConfig);
    }

    setUser(user) {
        this.currentUser = user;
        this.updateSecurityContext();
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        const userRoles = this.currentUser.roles || [];
        
        return userRoles.some(role => {
            const roleConfig = this.roles.get(role);
            return roleConfig && (
                roleConfig.permissions.includes('*') ||
                roleConfig.permissions.includes(permission)
            );
        });
    }

    hasRole(user, roleName) {
        return user.roles && user.roles.includes(roleName);
    }

    checkPolicy(policyName, resource) {
        const policy = this.policies.get(policyName);
        if (!policy || !this.currentUser) return false;
        return policy(this.currentUser, resource);
    }

    sanitizeString(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    encodeHTML(str) {
        return str.replace(/[&<>"']/g, (match) => {
            const char2Entity = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return char2Entity[match];
        });
    }

    generateCSRFToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    setupCSRFHeaders() {
        // Add CSRF token to all AJAX requests
        if (typeof window !== 'undefined') {
            const originalXHR = window.XMLHttpRequest;
            const self = this;
            
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                
                xhr.open = function() {
                    originalOpen.apply(xhr, arguments);
                    xhr.setRequestHeader('X-CSRF-Token', self.csrfToken);
                };
                
                return xhr;
            };
        }
    }

    validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    updateSecurityContext() {
        this.securityContext.clear();
        if (this.currentUser) {
            this.securityContext.set('userId', this.currentUser.id);
            this.securityContext.set('roles', this.currentUser.roles);
            this.securityContext.set('permissions', this.getUserPermissions());
        }
    }

    getUserPermissions() {
        if (!this.currentUser) return new Set();
        
        const permissions = new Set();
        const userRoles = this.currentUser.roles || [];
        
        userRoles.forEach(roleName => {
            const role = this.roles.get(roleName);
            if (role) {
                role.permissions.forEach(permission => permissions.add(permission));
            }
        });
        
        return permissions;
    }

    validateInput(input, schema) {
        // Implement input validation logic
        return true;
    }

    auditLog(action, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.id : 'anonymous',
            action,
            details,
            ip: this.getCurrentIP()
        };

        // Log the security event
        console.log('Security Audit:', logEntry);
    }

    getCurrentIP() {
        // Implementation depends on your environment
        return 'unknown';
    }
} 