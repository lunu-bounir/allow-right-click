'use strict';

chrome.browserAction.onClicked.addListener(tab => chrome.tabs.executeScript(tab.id, {
  allFrames: true,
  matchAboutBlank: true,
  code: `{
    if (window.loaded) {
      if (window === window.top) {
        alert('Allow right-click is already installed. If you still have issues with the right-click context menu, please use the FAQs page to report!');
      }
    }
    else {
      window.loaded = true;
      // allow context-menu
      const script = document.createElement('script');
      script.textContent = 'document.oncopy = document.onpaste = document.oncontextmenu = null;';
      document.documentElement.appendChild(script);
      document.documentElement.removeChild(script);
      // find the correct element
      let elements = [];
      document.addEventListener('mousedown', e => {
        const es = document.elementsFromPoint(e.clientX, e.clientY);
        const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
        const vids = es.filter(e => e.src && e.tagName === 'VIDEO');

        if (imgs.length || vids.length) {
          for (const e of es) {
            if (vids.length ? vids.indexOf(e) !== -1 : imgs.indexOf(e) !== -1) {
              break;
            }
            else {
              e.style['pointer-events'] = 'none';
              elements.push(e);
            }
          }
        }
      });
      document.addEventListener('contextmenu', () => window.setTimeout(() => {
        for (const e of elements) {
          e.style['pointer-events'] = 'unset';
        }
        elements = [];
      }));
    }
  }`,
  runAt: 'document_start'
}, () => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    alert(lastError.message);
  }
  else {
    chrome.browserAction.setIcon({
      tabId: tab.id,
      path: {
        '16': 'data/icons/active/16.png',
        '19': 'data/icons/active/19.png',
        '32': 'data/icons/active/32.png',
        '38': 'data/icons/active/38.png',
        '48': 'data/icons/active/48.png',
        '64': 'data/icons/active/64.png'
      }
    });
  }
}));

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': true,
  'last-update': 0
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        window.setTimeout(() => chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        }), 3000);
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
