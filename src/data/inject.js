'use strict';

if (window.injected) {
  if (window === window.top) {
    alert('Allow right-click is already installed. If you still have issues with the right-click context menu, please use the FAQs page to report!');
  }
}
else {
  window.injected = true;
  //
  document.documentElement.style['user-select'] = 'initial';
  document.documentElement.style['-webkit-user-select'] = 'initial';
  document.documentElement.style['-moz-user-select'] = 'initial';
  const body = () => {
    document.body.style['user-select'] = 'initial';
    document.body.style['-webkit-user-select'] = 'initial';
    document.body.style['-moz-user-select'] = 'initial';
  };
  if (document.body) {
    body();
  }
  else {
    document.addEventListener('DOMContentLoaded', body);
  }
  //
  const inject = code => {
    const script = document.createElement('script');
    script.textContent = code;
    document.documentElement.appendChild(script);
    script.remove();
  };
  // allow context-menu
  inject(`
    document.ondragstart =
    document.onmousedown =
    document.onselectstart =
    document.oncopy =
    document.onpaste =
    document.oncontextmenu = null;
    // do not allow altering
    Object.defineProperty(document, 'ondragstart', {});
    Object.defineProperty(document, 'onmousedown', {});
    Object.defineProperty(document, 'onselectstart', {});
    Object.defineProperty(document, 'oncopy', {});
    Object.defineProperty(document, 'onpaste', {});
    Object.defineProperty(document, 'oncontextmenu', {});

    const body = () => {
      document.body.ondragstart =
      document.body.onmousedown =
      document.body.onselectstart =
      document.body.oncopy =
      document.body.onpaste =
      document.body.oncontextmenu = null;
      // do not allow altering
      Object.defineProperty(document.body, 'ondragstart', {});
      Object.defineProperty(document.body, 'onmousedown', {});
      Object.defineProperty(document.body, 'onselectstart', {});
      Object.defineProperty(document.body, 'oncopy', {});
      Object.defineProperty(document.body, 'onpaste', {});
      Object.defineProperty(document.body, 'oncontextmenu', {});
    };
    if (document.body) {
      body()
    }
    else {
      document.addEventListener('DOMContentLoaded', body);
    }

    document.addEventListener('paste', e => {
      if (e.defaultPrevented) {
        const content = e.clipboardData.getData('Text');
        if (document.execCommand('insertText', null, content) === false) {
          if ('selectionStart' in e.target && 'selectionEnd' in e.target) {
            const old = e.target.value;
            const offset = e.target.selectionStart;
            e.target.value = old.substr(0, offset) + content + old.substr(e.target.selectionEnd);
            e.target.selectionStart = e.target.selectionEnd = offset + content.length;
          }
          else {
            e.target.value = content;
          }
        }
      }
    });

    window.alert = alert = (...args) => console.log('[alert is blocked]', ...args);
  `);
  // find the correct element
  let elements = [];
  document.addEventListener('mousedown', e => {
    if (e.button !== 2) {
      return;
    }
    // what if element is not clickable
    [...e.target.querySelectorAll('img,video')].forEach(e => {
      e.style['pointer-events'] = 'unset';
    });
    const es = document.elementsFromPoint(e.clientX, e.clientY);
    const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');

    if (imgs.length || vids.length) {
      for (const e of es) {
        if (vids.length ? vids.indexOf(e) !== -1 : imgs.indexOf(e) !== -1) {
          break;
        }
        else {
          elements.push({
            e,
            val: e.style['pointer-events']
          });
          e.style['pointer-events'] = 'none';
        }
      }
      inject(`{
        const es = document.elementsFromPoint(${e.clientX}, ${e.clientY});
        for (const e of es) {
          e.oncontextmenu = e => e.preventDefault = () => {};
        }
      }`);
    }
  });
  document.addEventListener('contextmenu', () => window.setTimeout(() => {
    for (const {e, val} of elements) {
      e.style['pointer-events'] = val;
    }
    elements = [];
  }));
  // unblock contextmenu and more
  inject(`{
    MouseEvent.prototype.preventDefault = () => {};
    ClipboardEvent.prototype.preventDefault = () => {};
  }`);
}
