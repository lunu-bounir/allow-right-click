// user-select (sheet)
{
  const clean = sheet => {
    try {
      const check = rule => {
        const {style} = rule;
        if (style['user-select']) {
          style['user-select'] = 'initial';
        }
      };
      const once = rule => {
        if (rule.style) {
          check(rule);
        }
        else if (rule.cssRules) {
          for (const r of rule.cssRules) {
            once(r);
          }
        }
      };

      for (const rule of sheet.rules) {
        once(rule);
      }
    }
    catch (e) {}
  };
  const check = () => {
    for (const sheet of document.styleSheets) {
      if (check.cache.has(sheet)) {
        continue;
      }
      const node = sheet.ownerNode;

      if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
        check.cache.set(sheet, true);
        clean(sheet);
      }
    }
  };
  check.cache = new WeakMap();
  const observer = new MutationObserver(ms => {
    let update = false;
    for (const m of ms) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const {target} = m;
          if (target.tagName === 'STYLE') {
            update = true;
          }
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
            node.addEventListener('load', () => check());
          }
          if (node.tagName === 'STYLE') {
            update = true;
          }
        }
      }
    }
    if (update) {
      check();
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true
  });
  window.pointers.run.add(() => observer.disconnect());
  check();
}
// user-select (inline)
{
  const observer = new MutationObserver(ms => {
    ms.forEach(m => {
      if (m.target) {
        if (m.target.style['user-select']) {
          window.pointers.record(m.target, 'user-select', m.target.style['user-select']);

          m.target.style['user-select'] = 'initial';
        }
      }
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style']
  });
  window.pointers.run.add(() => observer.disconnect());
  [...document.querySelectorAll('[style]')].forEach(e => {
    if (e.style['user-select']) {
      window.pointers.record(e, 'user-select', e.style['user-select']);

      e.style['user-select'] = 'initial';
    }
  });
}
