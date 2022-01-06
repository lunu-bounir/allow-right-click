// Tests
// https://500px.com/photo/1018247498/Moon-for-Sale-2-by-milos-nejezchleb/ -> right-click on image
// http://www.thelogconnection.com/gallery.php -> right-click on image
// https://www.instagram.com/p/CQ1DhTvs8PI/ -> right-click on image
// https://www.washingtonpost.com/photography/interactive/2021/surreal-photos-show-aftereffects-eruption-spains-cumbre-vieja-volcano/ -> right-click on image
// https://yonobusiness.sbi/login/yonobusinesslogin -> paste
// https://blog.daum.net/simhsook48/2592 -> text selection
// https://m.blog.naver.com/PostView.nhn?blogId=nurisejong&logNo=221050681781&targetKeyword=&targetRecommendationCode=1 -> text selection
// https://www.ploshtadslaveikov.com/reaktsii-za-statuyata-na-dayana-izobrazena-e-kato-nova-bogoroditsa-zashto/ -> text selection
// https://everyhark.tistory.com/298 -> text selection
// https://www.motofichas.com/marcas/benelli/leoncino-250 -> text selection
// https://www.skidrowreloaded.com/ -> text selection
// http://www.ciberespaciotv.com/p/ver-antena-3-en-directo-online.html -> context menu & text selection

window.pointers = window.pointers || {
  run: new Set(),
  scripts: new Set(),
  cache: new Map(),
  status: ''
};

window.pointers.record = (e, name, value) => {
  window.pointers.cache.set(e, {name, value});
};

window.pointers.inject = code => {
  const script = document.createElement('script');
  script.textContent = 'document.currentScript.dataset.injected = true;' + code;
  document.documentElement.appendChild(script);
  script.remove();
  if (script.dataset.injected !== 'true') {
    const s = document.createElement('script');
    s.src = 'data:text/javascript;charset=utf-8;base64,' + btoa(code);
    s.onload = () => s.remove();
    document.documentElement.appendChild(s);

    window.pointers.scripts.add(s);
    return s;
  }
  else {
    window.pointers.scripts.add(script);
    return script;
  }
};

{
  const next = () => {
    if (window.pointers.status === '' || window.pointers.status === 'removed') {
      window.pointers.status = 'ready';

      for (const script of window.pointers.scripts) {
        script.dispatchEvent(new Event('install'));
      }

      chrome.runtime.sendMessage({
        method: 'inject',
        files: [
          'user-select.js',
          'styles.js',
          'mouse.js',
          'listen.js'
        ]
      });
    }
    else {
      window.pointers.status = 'removed';

      chrome.runtime.sendMessage({
        method: 'release'
      });

      for (const c of window.pointers.run) {
        c();
      }
      window.pointers.run = new Set();

      for (const script of window.pointers.scripts) {
        script.dispatchEvent(new Event('remove'));
      }

      for (const [e, {name, value}] of window.pointers.cache) {
        e.style[name] = value;
      }
      window.pointers.cache = new Set();
    }
  };

  if (window.top === window) {
    next();
  }
  else {
    chrome.runtime.sendMessage({
      method: 'status'
    }, resp => {
      if (resp === 'removed' && window.pointers.status === '') {
        window.pointers.status = 'ready';
      }
      next();
    });
  }
}
