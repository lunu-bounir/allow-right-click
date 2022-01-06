'use strict';

const isFirefox = /Firefox/.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined';

const notify = message => chrome.notifications.create({
  title: chrome.runtime.getManifest().name,
  message,
  type: 'basic',
  iconUrl: 'data/icons/48.png'
});

const onClicked = (tabId, obj) => chrome.tabs.executeScript(tabId, Object.assign({
  matchAboutBlank: true,
  file: 'data/inject/core.js',
  runAt: 'document_start'
}, obj), () => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    console.warn(lastError);
    notify(lastError.message);
  }
});
chrome.browserAction.onClicked.addListener(tab => onClicked(tab.id, {
  allFrames: true
}));


chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'status') {
    chrome.tabs.executeScript(sender.tab.id, {
      runAt: 'document_start',
      code: 'window.pointers.status'
    }, r => response(r[0]));

    return true;
  }
  else if (request.method === 'inject') {
    if (sender.frameId === 0) {
      chrome.browserAction.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': 'data/icons/active/16.png',
          '32': 'data/icons/active/32.png',
          '48': 'data/icons/active/48.png'
        }
      });
    }
    for (const file of request.files) {
      chrome.tabs.executeScript(sender.tab.id, {
        matchAboutBlank: true,
        frameId: sender.frameId,
        file: 'data/inject/' + file,
        runAt: 'document_start'
      });
    }
  }
  else if (request.method === 'release') {
    if (sender.frameId === 0) {
      chrome.browserAction.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': 'data/icons/16.png',
          '32': 'data/icons/32.png',
          '48': 'data/icons/48.png'
        }
      });
    }
  }
});

// web navigation
{
  const cache = {};
  chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

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
    const method = isFirefox ? 'onDOMContentLoaded' : 'onCommitted';
    if (chrome.webNavigation) {
      chrome.webNavigation[method].removeListener(onCommitted);
      if (prefs.monitor) {
        chrome.webNavigation[method].addListener(onCommitted, {
          url: [{
            urlPrefix: 'http://'
          }, {
            urlPrefix: 'https://'
          }]
        });
      }
    }
    else {
      chrome.storage.local.set({
        monitor: false
      });
    }
  });
  callback();
  chrome.storage.onChanged.addListener(prefs => {
    if (prefs.monitor && prefs.monitor.newValue !== prefs.monitor.oldValue) {
      callback();
    }
  });
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
    if (chrome.webNavigation) {
      chrome.storage.local.set({
        monitor: true
      });
      notify(`"${hostname}" is added to the list`);
    }
    else {
      notify('For this feature to work, you need to enable "webNavigation" permission from the options page');
      setTimeout(() => chrome.runtime.openOptionsPage(), 3000);
    }
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
