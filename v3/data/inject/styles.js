// custom styles
{
  const next = () => {
    const s = document.createElement('style');
    s.textContent = `
      .copy-protection-on #single-article-right,
      .copy-protection-on {
        pointer-events: initial !important;
      }
      ::-moz-selection {
        color: #000 !important;
        background: #accef7 !important;
      }
      ::selection {
        color: #000 !important;
        background: #accef7 !important;
      }
    `;
    (document.head || document.body).appendChild(s);
    window.pointers.run.add(() => s.remove());
  };

  if (document.body) {
    next();
  }
  else {
    document.addEventListener('DOMContentLoaded', next);
  }
}
