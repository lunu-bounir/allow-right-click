// find the correct element
{
  const elements = new Map();
  const controllers = new Set();
  const tmps = new Set();

  const revert = reason => {
    // console.log('reverting', reason);

    for (const [e, val] of elements) {
      e.style['pointer-events'] = val;
      delete e.dataset.igblock;
    }
    elements.clear();
    for (const controller of controllers) {
      controller.abort();
    }
    controllers.clear();
    for (const img of tmps) {
      img.remove();
    }
    tmps.clear();
  };

  const unblock = e => {
    // what if element is not clickable
    for (const mv of (e.target.parentElement || e.target).querySelectorAll('img,canvas,video')) {
      elements.set(mv, mv.style['pointer-events']);
      mv.style.setProperty('pointer-events', 'all', 'important');
    }
    const es = document.elementsFromPoint(e.clientX, e.clientY);

    const imgs = es.filter(e => (e.src && e.tagName !== 'VIDEO') || e.tagName === 'CANVAS');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');
    const npts = es.filter(e => e.type && e.type.startsWith('text')); // INPUT[type=text], TEXTAREA
    const bgs = [];
    for (const e of es) {
      const style = getComputedStyle(e);
      const v = style.backgroundImage;
      if (v) {
        const match = v.match(/url\(["']?(.*?)["']?\)/);
        if (match) {
          bgs.push(match[1]);
        }
      }
    }

    const nlfy = e => {
      elements.set(e, e.style['pointer-events']);
      e.style['pointer-events'] = 'none';
      e.dataset.igblock = true;
    };

    if (vids.length) { // prefer video over image
      for (const e of es) {
        if (vids.includes(e) || npts.includes(e)) {
          e.focus();
          break;
        }
        else {
          nlfy(e);
        }
      }
    }
    else if (imgs.length) {
      for (const e of es) {
        if (imgs.includes(e) || npts.includes(e)) {
          e.focus();
          break;
        }
        else {
          nlfy(e);
        }
      }
    }
    else if (npts.length) {
      for (const e of es) {
        if (npts.includes(e)) {
          e.focus();
          break;
        }
        else {
          nlfy(e);
        }
      }
    }
    else if (bgs.length) {
      const img = new Image();
      img.width = 10;
      img.height = 10;
      img.style = `
        position: fixed;
        left: ${e.clientX - 5}px;
        top: ${e.clientY - 5}px;
        opacity: 0;
        z-index: 2147483647;
      `;
      img.src = bgs[0];
      document.body.append(img);
      tmps.add(img);
    }
  };

  const mousedown = e => {
    if (e.button !== 2) {
      return;
    }
    e.stopPropagation();
    revert('before.mousedown');
    unblock(e);

    const controller = new AbortController();
    controllers.add(controller);
    document.addEventListener('click', e => {
      revert('release.click');
    }, {
      once: true,
      signal: controller.signal
    });
  };

  const touchstart = e => {
    e.stopPropagation();
    revert('before.touchstart');
    unblock({
      target: e.target,
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    });

    const controller = new AbortController();
    controllers.add(controller);
    document.addEventListener('click', e => {
      revert('release.click');
    }, {
      once: true,
      signal: controller.signal
    });
  };

  document.addEventListener('mousedown', mousedown, true);
  document.addEventListener('touchstart', touchstart, true);
  window.pointers.run.add(() => {
    document.removeEventListener('mousedown', mousedown, true);
    document.removeEventListener('touchstart', touchstart, true);
  });
}

// eslint-disable-next-line semi
''
