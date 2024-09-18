// allow context-menu
window.pointers.inject(`
  try {
    const ogs = {
      removed: false,
      misc: {}
    };

    // alert
    ogs.misc.alert = window.alert;
    Object.defineProperty(window, 'alert', {
      get() {
        return ogs.removed ? ogs.misc.alert : (...args) => console.info('[alert is blocked]', ...args);
      },
      set(c) {
        ogs.misc.alert ||= c;
      }
    });

    // unblock contextmenu and more
    ogs.misc.mp = MouseEvent.prototype.preventDefault;
    Object.defineProperty(MouseEvent.prototype, 'preventDefault', {
      get() {
        return ogs.removed ? ogs.misc.mp : () => {};
      },
      set(c) {
        console.info('a try to overwrite "preventDefault"', c);
        ogs.misc.mp ||= c;
      }
    });
    Object.defineProperty(MouseEvent.prototype, 'returnValue', {
      get() {
        return ogs.removed && 'v' in this ? this.v : true;
      },
      set(c) {
        console.info('a try to overwrite "returnValue"', c);
        this.v = c;
      }
    });

    ogs.misc.cp = ClipboardEvent.prototype.preventDefault;
    Object.defineProperty(ClipboardEvent.prototype, 'preventDefault', {
      get() {
        return ogs.removed ? ogs.misc.cp : () => {};
      },
      set(c) {
        ogs.misc.cp ||= c;
      }
    });

    document.currentScript.addEventListener('remove', () => ogs.removed = true);
    document.currentScript.addEventListener('install', () => ogs.removed = false);
  }
  catch (e) {}
`);


{
  const skip = e => e.stopPropagation();
  // try to minimize exposure
  const keydown = e => {
    const meta = e.metaKey || e.ctrlKey;

    if (meta && ['KeyC', 'KeyV', 'KeyP', 'KeyA'].includes(e.code)) {
      e.stopPropagation();
    }
  };
  const paste = e => {
    e.stopPropagation();
    // some websites use input event to revert paste changes
    e.target.addEventListener('input', skip, true);
    requestAnimationFrame(() => {
      e.target.removeEventListener('input', skip, true);
    });
  };

  // bypass all registered listeners
  document.addEventListener('dragstart', skip, true);
  document.addEventListener('selectstart', skip, true);
  document.addEventListener('keydown', keydown, true);
  document.addEventListener('copy', skip, true);
  document.addEventListener('cut', skip, true);
  document.addEventListener('paste', paste, true);
  document.addEventListener('contextmenu', skip, true);
  document.addEventListener('mousedown', skip, true);

  window.pointers.run.add(() => {
    document.removeEventListener('dragstart', skip, true);
    document.removeEventListener('selectstart', skip, true);
    document.removeEventListener('keydown', keydown, true);
    document.removeEventListener('copy', skip, true);
    document.removeEventListener('cut', skip, true);
    document.removeEventListener('paste', paste, true);
    document.removeEventListener('contextmenu', skip, true);
    document.removeEventListener('mousedown', skip, true);
  });
}

// eslint-disable-next-line semi
''
