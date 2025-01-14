try {
  let sr = Selection.prototype.removeAllRanges;

  Object.defineProperty(Selection.prototype, 'removeAllRanges', {
    get() {
      return () => {};
    },
    set(c) {
      console.info('a try to overwrite "removeAllRanges"', c);
      sr ||= c;
    },
    configurable: true
  });

  document.documentElement.addEventListener('arc-remove', () => {
    Object.defineProperty(Selection.prototype, 'removeAllRanges', {
      get() {
        return sr;
      },
      configurable: true
    });
  });
}
catch (e) {}

// eslint-disable-next-line semi
''
