import { animate, createTimeline, stagger } from 'animejs';

/**
 * Animate the Hero elements entrance when the component mounts
 */
export function animateHeroEntrance() {
  try {
    const tl = createTimeline({
      defaults: {
        ease: 'outExpo',
        duration: 900
      }
    });

    // 1. Central runner expand
    tl.add('.hero-center-stripe', {
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 800,
      ease: 'outQuart'
    }, 0);

    // 2. Main title drop in
    tl.add('.hero-headline', {
      translateY: [-35, 0],
      opacity: [0, 1],
      duration: 850
    }, 150);

    // 3. Search pill pop
    tl.add('.hero-search-pill', {
      scale: [0.85, 1],
      opacity: [0, 1],
      duration: 600,
      ease: 'outBack(1.4)'
    }, 300);

    // 4. Center Courier image slide up
    tl.add('.hero-scooter-courier', {
      translateY: [60, 0],
      opacity: [0, 1],
      duration: 1000,
      ease: 'outCubic'
    }, 350);

    // 5. Left column elements stagger in
    tl.add('.hero-col-left > *', {
      translateX: [-30, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 750
    }, 450);

    // 6. Right column elements stagger in
    tl.add('.hero-col-right > *', {
      translateX: [30, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 750
    }, 450);

    return tl;
  } catch (err) {
    console.warn('Hero animation error:', err);
  }
}

/**
 * Continuous rotating animation for the food emblem text ring
 */
export function animateBadgeRotation(targetSelector) {
  try {
    const el = document.querySelector(targetSelector);
    if (!el) return null;
    return animate(el, {
      rotate: 360,
      duration: 16000,
      ease: 'linear',
      loop: true
    });
  } catch (err) {
    console.warn('Rotation animation error:', err);
  }
}

/**
 * Organic floating / bobbing micro-animations for accents (flying courier, pizza plate)
 */
export function animateFloatingElements() {
  try {
    const flyingEl = document.querySelector('.hero-flying-courier');
    if (flyingEl) {
      animate(flyingEl, {
        translateY: [-8, 8],
        rotate: [-1.5, 1.5],
        duration: 2600,
        ease: 'inOutSine',
        alternate: true,
        loop: true
      });
    }

    const pizzaBadge = document.querySelector('.hero-badge-wrap');
    if (pizzaBadge) {
      animate(pizzaBadge, {
        translateY: [-5, 5],
        duration: 3200,
        ease: 'inOutQuad',
        alternate: true,
        loop: true
      });
    }
  } catch (err) {
    console.warn('Floating animation error:', err);
  }
}

/**
 * Animate numeric counter counting up from start to end value
 */
export function animateCounter(targetObj, property, targetVal, duration = 1200, onUpdate) {
  try {
    return animate(targetObj, {
      [property]: targetVal,
      duration,
      ease: 'outCubic',
      round: 1,
      onUpdate
    });
  } catch (err) {
    console.warn('Counter animation error:', err);
  }
}

/**
 * Initialize scroll reveal animations for cards and sections
 */
export function initScrollReveal() {
  try {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            target.classList.add('is-revealed');
            
            // Trigger Anime.js spring stagger on child items if available
            const animatableChildren = target.querySelectorAll('.stagger-item');
            if (animatableChildren.length > 0) {
              animate(animatableChildren, {
                translateY: [25, 0],
                opacity: [0, 1],
                delay: stagger(75),
                duration: 650,
                ease: 'outCubic'
              });
            } else {
              animate(target, {
                translateY: [20, 0],
                opacity: [0, 1],
                duration: 600,
                ease: 'outCubic'
              });
            }

            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll('.editorial-section:not(.is-revealed)');
    sections.forEach((sec) => observer.observe(sec));

    return observer;
  } catch (err) {
    console.warn('Scroll reveal error:', err);
  }
}
