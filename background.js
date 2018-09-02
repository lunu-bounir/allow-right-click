'use strict';

var notify = message => chrome.notifications.create({
  title: chrome.runtime.getManifest().name,
  message,
  type: 'basic',
  iconUrl: 'data/icons/48.png'
});

const onClicked = (tabId, obj) => chrome.tabs.executeScript(tabId, Object.assign({
  matchAboutBlank: true,
  file: 'data/inject.js',
  runAt: 'document_start'
}, obj), () => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    alert(lastError.message);
  }
  else {
    chrome.browserAction.setIcon({
      tabId: tabId,
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
});
chrome.browserAction.onClicked.addListener(tab => onClicked(tab.id, {
  allFrames: true
}));

// web navigation
{
  const cache = {};

  const onCommitted = d => {
    console.log(d);
    if (d.frameId === 0) {
      const {hostname} = new URL(d.url);
      cache[d.tabId] = localStorage.getItem('hostname:' + hostname) === 'true';
    }
    if (cache[d.tabId]) {
      onClicked(d.tabId, {
        frameId: d.frameId
      });
    }
  };
  const callback = () => chrome.storage.local.get({
    monitor: false
  }, prefs => {
    console.log(prefs);
    chrome.webNavigation.onCommitted.removeListener(onCommitted);
    if (prefs.monitor) {
      chrome.webNavigation.onCommitted.addListener(onCommitted, {
        url: [{
          urlPrefix: 'http://'
        }, {
          urlPrefix: 'https://'
        }]
      });
    }
  });
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
  chrome.storage.onChanged.addListener(prefs => prefs.monitor && callback());
}

// context menu
{
  const callback = () => chrome.contextMenus.create({
    id: 'add-to-whitelist',
    title: 'Automatically activate extension on this hostname',
    contexts: ['browser_action']
  });
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = tab.url;
  if (url.startsWith('http')) {
    const {hostname} = new URL(url);
    localStorage.setItem('hostname:' + hostname, true);
    chrome.storage.local.set({
      monitor: true
    });
    notify(`"${hostname}" is added to the list`);
  }
  else {
    notify('this is not a valid URL');
  }
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': true,
  'last-update': 0
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 45 days ago.
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
