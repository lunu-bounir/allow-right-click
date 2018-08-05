'use strict';

if (window.loaded) {
  if (window === window.top) {
    alert('Allow right-click is already installed. If you still have issues with the right-click context menu, please use the FAQs page to report!');
  }
}
else {
  window.loaded = true;
  //
  const inject = code => {
    const script = document.createElement('script');
    script.textContent = code;
    document.documentElement.appendChild(script);
    script.remove();
  };
  // allow context-menu
  inject('document.oncopy = document.onpaste = document.oncontextmenu = null;');
  // find the correct element
  let elements = [];
  document.addEventListener('mousedown', e => {
    if (e.button !== 2) {
      return;
    }
    const es = document.elementsFromPoint(e.clientX, e.clientY);
    const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');

    if (imgs.length || vids.length) {
      for (const e of es) {
        if (vids.length ? vids.indexOf(e) !== -1 : imgs.indexOf(e) !== -1) {
          break;
        }
        else {
          e.dataset['pointer-events'] = e.style['pointer-events'];
          e.style['pointer-events'] = 'none';
          elements.push(e);
        }
      }
      inject(`{
        const es = document.elementsFromPoint(${e.clientX}, ${e.clientY});
        for (const e of es) {
          e.oncontextmenu = null;
        }
      }`);
    }
  });
  document.addEventListener('contextmenu', () => window.setTimeout(() => {
    for (const e of elements) {
      e.style['pointer-events'] = e.dataset['pointer-events'];
    }
    elements = [];
  }));
}
