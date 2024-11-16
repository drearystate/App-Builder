class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Set();
        this.initializeDefaultAnimations();
    }

    initializeDefaultAnimations() {
        // Fade animations
        this.registerAnimation('fadeIn', {
            keyframes: [
                { opacity: 0 },
                { opacity: 1 }
            ],
            options: {
                duration: 300,
                easing: 'ease-in-out',
                fill: 'forwards'
            }
        });

        this.registerAnimation('fadeOut', {
            keyframes: [
                { opacity: 1 },
                { opacity: 0 }
            ],
            options: {
                duration: 300,
                easing: 'ease-in-out',
                fill: 'forwards'
            }
        });

        // Slide animations
        this.registerAnimation('slideIn', {
            keyframes: [
                { transform: 'translateX(-100%)' },
                { transform: 'translateX(0)' }
            ],
            options: {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            }
        });

        // Scale animations
        this.registerAnimation('scaleIn', {
            keyframes: [
                { transform: 'scale(0)' },
                { transform: 'scale(1)' }
            ],
            options: {
                duration: 300,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            }
        });

        // Custom animations
        this.registerAnimation('bounce', {
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-20px)' },
                { transform: 'translateY(0)' }
            ],
            options: {
                duration: 500,
                easing: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
                iterations: 1
            }
        });
    }

    registerAnimation(name, config) {
        this.animations.set(name, config);
    }

    animate(element, animationName, customOptions = {}) {
        const animation = this.animations.get(animationName);
        if (!animation) {
            throw new Error(`Animation '${animationName}' not found`);
        }

        const options = { ...animation.options, ...customOptions };
        const animationInstance = element.animate(animation.keyframes, options);
        
        this.activeAnimations.add(animationInstance);
        
        return new Promise((resolve) => {
            animationInstance.onfinish = () => {
                this.activeAnimations.delete(animationInstance);
                resolve();
            };
        });
    }

    createSequence(animations) {
        return async (element) => {
            for (const { name, options } of animations) {
                await this.animate(element, name, options);
            }
        };
    }

    createParallel(animations) {
        return (element) => {
            return Promise.all(
                animations.map(({ name, options }) => 
                    this.animate(element, name, options)
                )
            );
        };
    }

    stopAll() {
        this.activeAnimations.forEach(animation => animation.cancel());
        this.activeAnimations.clear();
    }

    createTransition(element, properties, options = {}) {
        const defaultOptions = {
            duration: '300ms',
            easing: 'ease',
            delay: '0s'
        };

        const transitionOptions = { ...defaultOptions, ...options };
        const transitionString = properties
            .map(prop => `${prop} ${transitionOptions.duration} ${transitionOptions.easing} ${transitionOptions.delay}`)
            .join(', ');

        element.style.transition = transitionString;
    }

    createKeyframeAnimation(name, keyframes) {
        const keyframeString = `@keyframes ${name} {
            ${Object.entries(keyframes)
                .map(([key, value]) => `${key} { ${this.generateCSSText(value)} }`)
                .join('\n')}
        }`;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframeString;
        document.head.appendChild(styleSheet);
    }

    generateCSSText(styles) {
        return Object.entries(styles)
            .map(([property, value]) => `${property}: ${value};`)
            .join(' ');
    }
} 