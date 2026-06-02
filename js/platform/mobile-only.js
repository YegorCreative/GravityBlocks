(function () {
  'use strict';

  function isMobileExperience() {
    const hasTouch = (navigator.maxTouchPoints || 0) > 0;
    const coarsePointer = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const screenMin = Math.min(window.screen.width || 0, window.screen.height || 0);
    const screenLooksMobile = screenMin > 0 && screenMin <= 1024;

    return coarsePointer || mobileUA || (hasTouch && screenLooksMobile);
  }

  function applyMobileGate() {
    const body = document.body;
    const gate = document.getElementById('mobileOnlyGate');
    if (!body) return false;

    const supported = isMobileExperience();
    body.classList.toggle('mobile-supported', supported);
    body.classList.toggle('mobile-blocked', !supported);

    if (gate) {
      gate.hidden = supported;
      gate.setAttribute('aria-hidden', supported ? 'true' : 'false');
    }

    return supported;
  }

  function initMobileOnlyGate() {
    let rafId = 0;
    const scheduleApply = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        applyMobileGate();
      });
    };

    window.addEventListener('resize', scheduleApply, { passive: true });
    window.addEventListener('orientationchange', scheduleApply, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleApply, { passive: true });
    }

    return applyMobileGate();
  }

  window.GravityBlocksMobileOnly = {
    isMobileExperience,
    initMobileOnlyGate
  };
})();