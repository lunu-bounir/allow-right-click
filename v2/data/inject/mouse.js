// find the correct element
{
  let elements = [];

  const mousedonw = e => {
    if (e.button !== 2) {
      return;
    }
    e.stopPropagation();

    // what if element is not clickable
    for (const mv of (e.target.parentElement || e.target).querySelectorAll('img,video')) {
      elements.push({
        e: mv,
        val: mv.style['pointer-events']
      });
      mv.style.setProperty('pointer-events', 'all', 'important');
    }
    const es = document.elementsFromPoint(e.clientX, e.clientY);

    const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');
    const npts = es.filter(e => e.type && e.type.startsWith('text')); // INPUT[type=text], TEXTAREA

    const nlfy = e => {
      elements.push({
        e,
        val: e.style['pointer-events']
      });
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
    setTimeout(() => {
      for (const {e, val} of elements) {
        e.style['pointer-events'] = val;
        delete e.dataset.igblock;
      }
      elements = [];
    }, 300);
  };

  document.addEventListener('mousedown', mousedonw, true);
  window.pointers.run.add(() => {
    document.removeEventListener('mousedown', mousedonw, true);
  });
}
