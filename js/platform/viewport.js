(function () {
  'use strict';

  function fitStage() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    const vv = window.visualViewport;
    const vw = (vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 500;
    const vh = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 1000;
    const header = document.querySelector('header');
    const controls = document.querySelector('.mobile-controls');
    const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const controlsVisible = controls && getComputedStyle(controls).display !== 'none';
    const controlsH = controlsVisible ? Math.ceil(controls.getBoundingClientRect().height) : 0;
    const vPad = 12;
    const availW = Math.max(200, vw - 24);
    const availH = Math.max(300, vh - headerH - controlsH - vPad * 2);
    const s = Math.max(0.2, Math.min(availW / 500, availH / 1000));

    stage.style.transform = `scale(${s})`;
  }

  function bindStageAutoFit() {
    let fitStageRaf = 0;
    const scheduleFitStage = () => {
      if (fitStageRaf) return;
      fitStageRaf = requestAnimationFrame(() => {
        fitStageRaf = 0;
        fitStage();
      });
    };

    window.addEventListener('resize', scheduleFitStage, { passive: true });
    window.addEventListener('orientationchange', scheduleFitStage, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleFitStage, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleFitStage, { passive: true });
    }

    return scheduleFitStage;
  }

  window.GravityBlocksViewport = {
    fitStage,
    bindStageAutoFit
  };
})();
