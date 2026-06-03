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

    const imgs = [];
    const vids = [];
    const npts = []; // INPUT[type=text], TEXTAREA
    const bgs = [];

    for (const e of es) {
      if ((e.src && e.tagName !== 'VIDEO') || e.tagName === 'CANVAS') {
        imgs.push(e);
      }
      if (e.src && e.tagName === 'VIDEO') {
        vids.push(e);
      }
      if (e.type && e.type.startsWith('text')) {
        npts.push(e);
      }

      // if input is editable, detecting bg image cause wrong context to appear
      if (['INPUT', 'TEXTAREA'].includes(e.tagName)) {
        continue;
      }

      const style = getComputedStyle(e);
      const v = style.backgroundImage;
      if (v) {
        const match = v.match(/url\(["']?(.*?)["']?\)/);
        if (match) {
          bgs.push({
            e,
            src: match[1]
          });
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
    else if (imgs.length || bgs.length) {
      const next = {
        imgs() {
          for (const e of es) {
            if (imgs.includes(e) || npts.includes(e)) {
              e.focus();
              break;
            }
            else {
              nlfy(e);
            }
          }
        },
        bgs() {
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
          img.src = bgs[0].src;
          document.body.append(img);
          tmps.add(img);
        }
      };
      // should we prefer img or bg based on their index
      if (imgs.length === 0) {
        next.bgs();
      }
      else if (bgs.length === 0) {
        next.imgs();
      }
      else {
        const ni = es.indexOf(imgs[0]);
        const nb = es.indexOf(bgs[0].e);

        if (nb < ni) {
          next.bgs();
        }
        else {
          next.imgs();
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
