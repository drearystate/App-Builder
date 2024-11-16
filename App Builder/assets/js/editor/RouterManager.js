class RouterManager {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.guards = new Map();
        this.middlewares = [];
        this.params = new Map();
        this.queryParams = new URLSearchParams();
        this.initializeRouter();
    }

    initializeRouter() {
        this.setupEventListeners();
        this.setupMiddlewares();
        this.handleInitialRoute();
    }

    setupEventListeners() {
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Intercept link clicks for SPA navigation
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && this.shouldHandleLink(link)) {
                event.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    }

    setupMiddlewares() {
        // Authentication middleware
        this.addMiddleware(async (to, from, next) => {
            if (to.requiresAuth && !this.isAuthenticated()) {
                return this.navigate('/login', { 
                    redirect: to.path 
                });
            }
            return next();
        });

        // Analytics middleware
        this.addMiddleware(async (to, from, next) => {
            const result = await next();
            this.trackPageView(to);
            return result;
        });
    }

    registerRoute(path, config) {
        const route = {
            path,
            ...config,
            regex: this.createRouteRegex(path),
            params: this.extractRouteParams(path)
        };

        this.routes.set(path, route);
    }

    createRouteRegex(path) {
        return new RegExp(
            '^' + path.replace(/:[^\s/]+/g, '([^/]+)') + '$'
        );
    }

    extractRouteParams(path) {
        const params = [];
        path.replace(/:([^\s/]+)/g, (match, param) => {
            params.push(param);
        });
        return params;
    }

    async navigate(path, options = {}) {
        const { replace = false, state = {} } = options;
        const url = new URL(path, window.location.origin);
        
        // Find matching route
        const route = this.findRoute(url.pathname);
        if (!route) {
            return this.handleNotFound(url.pathname);
        }

        // Extract params and query params
        this.extractUrlParams(route, url.pathname);
        this.queryParams = new URLSearchParams(url.search);

        // Check guards
        const guardResult = await this.checkGuards(route);
        if (guardResult === false) {
            return false;
        }

        // Run middleware chain
        const middlewareChain = this.createMiddlewareChain(route, this.currentRoute);
        const navigationResult = await middlewareChain();
        
        if (navigationResult === false) {
            return false;
        }

        // Update history
        if (replace) {
            window.history.replaceState(state, '', url.href);
        } else {
            window.history.pushState(state, '', url.href);
        }

        // Update current route and render
        const previousRoute = this.currentRoute;
        this.currentRoute = route;
        
        await this.renderRoute(route, previousRoute);
        this.notifyRouteChange(route, previousRoute);

        return true;
    }

    async handlePopState(event) {
        await this.navigate(window.location.pathname + window.location.search, {
            replace: true,
            state: event.state
        });
    }

    findRoute(pathname) {
        for (const route of this.routes.values()) {
            if (route.regex.test(pathname)) {
                return route;
            }
        }
        return null;
    }

    extractUrlParams(route, pathname) {
        const matches = pathname.match(route.regex);
        if (!matches) return;

        this.params.clear();
        route.params.forEach((param, index) => {
            this.params.set(param, matches[index + 1]);
        });
    }

    async checkGuards(route) {
        const guards = [...this.guards.values()];
        
        for (const guard of guards) {
            const result = await guard(route, this.currentRoute);
            if (result === false) {
                return false;
            }
            if (typeof result === 'string') {
                await this.navigate(result);
                return false;
            }
        }

        return true;
    }

    addGuard(name, guardFn) {
        this.guards.set(name, guardFn);
    }

    removeGuard(name) {
        this.guards.delete(name);
    }

    addMiddleware(middleware) {
        this.middlewares.push(middleware);
    }

    createMiddlewareChain(to, from) {
        const middlewares = [...this.middlewares];
        
        const executeMiddleware = async (index) => {
            if (index >= middlewares.length) return true;
            
            return await middlewares[index](to, from, () => 
                executeMiddleware(index + 1)
            );
        };

        return () => executeMiddleware(0);
    }

    async renderRoute(route, previousRoute) {
        try {
            // Cleanup previous route
            if (previousRoute && previousRoute.onLeave) {
                await previousRoute.onLeave();
            }

            // Handle loading state
            this.showLoading();

            // Load component if needed
            if (route.component && typeof route.component === 'function') {
                route.component = await route.component();
            }

            // Render new route
            if (route.onEnter) {
                await route.onEnter();
            }

            // Update DOM
            const mainContent = document.getElementById('main-content');
            if (mainContent && route.component) {
                mainContent.innerHTML = '';
                mainContent.appendChild(route.component);
            }

        } catch (error) {
            console.error('Error rendering route:', error);
            this.handleRouteError(error);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loader = document.getElementById('route-loader');
        if (loader) loader.style.display = 'block';
    }

    hideLoading() {
        const loader = document.getElementById('route-loader');
        if (loader) loader.style.display = 'none';
    }

    handleNotFound(pathname) {
        const notFoundRoute = this.routes.get('404');
        if (notFoundRoute) {
            return this.navigate('/404', { replace: true });
        }
        console.error(`Route not found: ${pathname}`);
        return false;
    }

    handleRouteError(error) {
        const errorRoute = this.routes.get('error');
        if (errorRoute) {
            return this.navigate('/error', { 
                replace: true,
                state: { error }
            });
        }
        console.error('Route error:', error);
    }

    getParam(name) {
        return this.params.get(name);
    }

    getQueryParam(name) {
        return this.queryParams.get(name);
    }

    setQueryParam(name, value) {
        this.queryParams.set(name, value);
        this.updateQueryString();
    }

    updateQueryString() {
        const queryString = this.queryParams.toString();
        const newUrl = `${window.location.pathname}${queryString ? '?' + queryString : ''}`;
        window.history.replaceState(null, '', newUrl);
    }

    handleInitialRoute() {
        const initialPath = window.location.pathname + window.location.search;
        this.navigate(initialPath, { replace: true });
    }

    shouldHandleLink(link) {
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');
        
        return href && 
               !href.startsWith('#') && 
               !href.startsWith('http') && 
               target !== '_blank';
    }

    trackPageView(route) {
        // Implement analytics tracking
        console.log('Page view:', route.path);
    }

    isAuthenticated() {
        // Implement your authentication check
        return true;
    }

    back() {
        window.history.back();
    }

    forward() {
        window.history.forward();
    }

    getRouteByName(name) {
        return Array.from(this.routes.values())
            .find(route => route.name === name);
    }

    generatePath(routeName, params = {}) {
        const route = this.getRouteByName(routeName);
        if (!route) return '';

        let path = route.path;
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
        });

        return path;
    }

    notifyRouteChange(newRoute, oldRoute) {
        window.dispatchEvent(new CustomEvent('routechange', {
            detail: {
                from: oldRoute,
                to: newRoute,
                params: Object.fromEntries(this.params),
                query: Object.fromEntries(this.queryParams)
            }
        }));
    }
} 