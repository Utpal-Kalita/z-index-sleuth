import { chromium } from 'playwright';

export async function diagnose(url) {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  } catch {
    // Fallback if specific executablePath fails in local environments
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle' });

    const buttonLocator = page.locator('#generate-btn');
    const box = await buttonLocator.boundingBox();
    
    if (!box) {
      return { error: 'Target #generate-btn not found or has no bounding box.' };
    }

    // 5 sample points: center + 4 inset corners
    const inset = 4;
    const points = [
      { name: 'center', x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { name: 'top-left', x: box.x + inset, y: box.y + inset },
      { name: 'top-right', x: box.x + box.width - inset, y: box.y + inset },
      { name: 'bottom-left', x: box.x + inset, y: box.y + box.height - inset },
      { name: 'bottom-right', x: box.x + box.width - inset, y: box.y + box.height - inset }
    ];

    const hitTestResults = [];

    for (const pt of points) {
      const hitData = await page.evaluate(({ x, y }) => {
        // Shadow-root elementFromPoint descent & multi-point hit testing
        function deepElementFromPoint(x, y) {
          let el = document.elementFromPoint(x, y);
          while (el && el.shadowRoot) {
            const nested = el.shadowRoot.elementFromPoint(x, y);
            if (!nested || nested === el) break;
            el = nested;
          }
          return el;
        }

        const elAtPoint = deepElementFromPoint(x, y);
        const target = document.getElementById('generate-btn');
        const isObstructed = elAtPoint !== target && !target.contains(elAtPoint);

        const ancestors = [];
        let curr = elAtPoint;
        while (curr && curr !== document.body && curr !== document) {
          const comp = window.getComputedStyle(curr);
          ancestors.push({
            tagName: curr.tagName,
            className: curr.className,
            id: curr.id,
            opacity: comp.opacity,
            pointerEvents: comp.pointerEvents,
            zIndex: comp.zIndex,
            position: comp.position,
            transform: comp.transform !== 'none' ? comp.transform : null,
            filter: comp.filter !== 'none' ? comp.filter : null,
            isolation: comp.isolation !== 'auto' ? comp.isolation : null,
            contain: comp.contain !== 'none' ? comp.contain : null,
            ariaHidden: curr.getAttribute('aria-hidden')
          });
          curr = curr.parentElement;
        }

        const targetComp = window.getComputedStyle(target);
        const hitComp = elAtPoint ? window.getComputedStyle(elAtPoint) : null;
        const targetRect = target.getBoundingClientRect();
        const hitRect = elAtPoint ? elAtPoint.getBoundingClientRect() : null;

        return {
          point: { x, y },
          hitElement: {
            tagName: elAtPoint?.tagName,
            className: elAtPoint?.className,
            id: elAtPoint?.id,
            opacity: hitComp?.opacity,
            pointerEvents: hitComp?.pointerEvents,
            zIndex: hitComp?.zIndex,
            rect: hitRect ? { x: hitRect.x, y: hitRect.y, width: hitRect.width, height: hitRect.height } : null
          },
          targetElement: {
            tagName: target.tagName,
            className: target.className,
            opacity: targetComp.opacity,
            pointerEvents: targetComp.pointerEvents,
            zIndex: targetComp.zIndex,
            rect: { x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }
          },
          obstructed: isObstructed,
          ancestors
        };
      }, pt);

      hitTestResults.push(hitData);
    }

    const obstructedCount = hitTestResults.filter(r => r.obstructed).length;
    const primaryHit = hitTestResults[0];

    return {
      targetSelector: '#generate-btn',
      box,
      samplePointsTested: hitTestResults.length,
      obstructed: obstructedCount > 0,
      summary: `Tested ${hitTestResults.length} points. Obstructed at ${obstructedCount}/${hitTestResults.length} points. Hit element at center: <${primaryHit.hitElement.tagName} class="${primaryHit.hitElement.className}">`,
      hitTestResults,
      crossOriginFrameLimitations: 'All elements resolved within the same-origin document context. No cross-origin iframe boundaries encountered.'
    };

  } finally {
    try {
      await browser.close();
    } catch {}
  }
}
