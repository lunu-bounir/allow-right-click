'use strict';

const notify = message => chrome.notifications.create({
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
    title: 'Automatically Activate this Extension on this Hostname',
    contexts: ['browser_action']
  });
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = tab.url || info.pageUrl;
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

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
