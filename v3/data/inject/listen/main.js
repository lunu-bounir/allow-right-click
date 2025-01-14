try {
  const ogs = {
    removed: false,
    pointers: {}
  };
  ogs.pointers.alert = window.alert;
  ogs.pointers.mp = MouseEvent.prototype.preventDefault;
  ogs.pointers.cp = ClipboardEvent.prototype.preventDefault;

  // alert
  Object.defineProperty(window, 'alert', {
    get() {
      return (...args) => console.info('[alert is blocked]', ...args);
    },
    set(c) {
      ogs.pointers.alert ||= c;
    },
    configurable: true
  });

  // unblock contextmenu and more
  Object.defineProperty(MouseEvent.prototype, 'preventDefault', {
    get() {
      return () => {};
    },
    set(c) {
      console.info('a try to overwrite "preventDefault"', c);
      ogs.pointers.mp ||= c;
    },
    configurable: true
  });
  Object.defineProperty(MouseEvent.prototype, 'returnValue', {
    get() {
      return ogs.removed && 'v' in this ? this.v : true;
    },
    set(c) {
      console.info('a try to overwrite "returnValue"', c);
      this.v = c;
    },
    configurable: true
  });
  Object.defineProperty(ClipboardEvent.prototype, 'preventDefault', {
    get() {
      return () => {};
    },
    set(c) {
      ogs.pointers.cp ||= c;
    },
    configurable: true
  });

  document.documentElement.addEventListener('arc-remove', () => {
    ogs.removed = true;
    Object.defineProperty(window, 'alert', {
      get() {
        return ogs.pointers.alert;
      },
      configurable: true
    });
    Object.defineProperty(MouseEvent.prototype, 'preventDefault', {
      get() {
        return ogs.pointers.mp;
      },
      configurable: true
    });
    Object.defineProperty(ClipboardEvent.prototype, 'preventDefault', {
      get() {
        return ogs.pointers.cp;
      },
      configurable: true
    });
  });
}
catch (e) {
  console.error('listen/main', e);
}

// eslint-disable-next-line semi
''
