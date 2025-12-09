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
// https://soap2day.film/movie/a-special-lady-92zon/1-full -> right-click on movie (requires sub-frame access)
// https://www.taiwanratings.com/portal/front/listSpRating -> Ctrl + C on Windows
// https://www.yuanta.com.tw/eYuanta/securities/Node/Index?MainId=00412&C1=2018040407582803&C2=2018040401231916&ID=2018040401231916&Level=2&rnd=28994 -> select a large portion of the table
// https://brickset.com/signup -> no paste context menu on email address

window.pointers = window.pointers || {
  run: new Set(),
  cache: new Map(),
  status: ''
};

window.pointers.record = (e, name, value) => {
  window.pointers.cache.set(e, {name, value});
};

{
  const next = () => {
    if (window.pointers.status === '' || window.pointers.status === 'removed') {
      window.pointers.status = 'ready';

      chrome.runtime.sendMessage({
        method: 'inject',
        automated: self.automated,
        protected: [
          'user-select/isolated.js',
          'styles.js',
          'mouse.js',
          'listen/isolated.js'
        ],
        unprotected: [
          'user-select/main.js',
          'listen/main.js'
        ]
      });
      delete self.automated;
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

      document.documentElement.dispatchEvent(new Event('arc-remove'));

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

// eslint-disable-next-line semi
''
