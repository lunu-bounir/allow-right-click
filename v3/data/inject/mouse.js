// find the correct element
{
  const elements = new Map();

  const revert = () => {
    for (const [e, val] of elements) {
      e.style['pointer-events'] = val;
      delete e.dataset.igblock;
    }
    elements.clear();
  };

  const unblock = e => {
    // what if element is not clickable
    for (const mv of (e.target.parentElement || e.target).querySelectorAll('img,video')) {
      elements.set(mv, mv.style['pointer-events']);
      mv.style.setProperty('pointer-events', 'all', 'important');
    }
    const es = document.elementsFromPoint(e.clientX, e.clientY);

    const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');
    const npts = es.filter(e => e.type && e.type.startsWith('text')); // INPUT[type=text], TEXTAREA

    const nlfy = e => {
      elements.set(e, e.style['pointer-events']);
      e.style['pointer-events'] = 'none';
      e.dataset.igblock = true;
    };

    if (vids.length) { // prefer video over image
      for (const e of es) {
        if (vids.includes(e) || npts.includes(e)) {
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
    revert();
    unblock(e);
    clearTimeout(revert.id);
    revert.id = setTimeout(revert, 500);
  };

  const touchstart = e => {
    e.stopPropagation();
    revert();
    unblock({
      target: e.target,
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    });
    clearTimeout(revert.id);
    revert.id = setTimeout(revert, 2000);
  };

  document.addEventListener('mousedown', mousedown, true);
  document.addEventListener('touchstart', touchstart, true);
  window.pointers.run.add(() => {
    document.removeEventListener('mousedown', mousedown, true);
    document.removeEventListener('touchstart', touchstart, true);
  });
}
