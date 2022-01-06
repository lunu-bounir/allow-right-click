// find the correct element
{
  let elements = [];

  const mousedonw = e => {
    if (e.button !== 2) {
      return;
    }
    e.stopPropagation();

    // what if element is not clickable
    [...e.target.querySelectorAll('img,video')].forEach(e => {
      e.style.setProperty('pointer-events', 'all', 'important');
      // e.style['pointer-events'] = 'unset';
    });
    const es = document.elementsFromPoint(e.clientX, e.clientY);

    const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
    const vids = es.filter(e => e.src && e.tagName === 'VIDEO');

    const nlfy = e => {
      elements.push({
        e,
        val: e.style['pointer-events']
      });
      e.style['pointer-events'] = 'none';
      e.dataset.igblock = true;
    };

    if (imgs.length || vids.length) {
      for (const e of es) {
        if (vids.length ? vids.indexOf(e) !== -1 : imgs.indexOf(e) !== -1) {
          break;
        }
        else {
          nlfy(e);
        }
      }
      // window.pointers.inject(`{
      //   const es = document.elementsFromPoint(${e.clientX}, ${e.clientY});
      //   for (const e of es) {
      //     const c = e.oncontextmenu;
      //     e.oncontextmenu = e => e.preventDefault = () => {};
      //     setTimeout(() => e.oncontextmenu = c, 300);
      //   }
      // }`);
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
