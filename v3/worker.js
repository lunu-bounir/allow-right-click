self.importScripts('./context.js');

const g = id => chrome.i18n.getMessage(id);

const notify = message => chrome.notifications.create({
  title: chrome.runtime.getManifest().name,
  message,
  type: 'basic',
  iconUrl: '/data/icons/48.png'
});

const onClicked = (tabId, obj) => chrome.scripting.executeScript({
  target: {
    tabId,
    ...obj
  },
  files: ['/data/inject/core.js']
}, () => {
  const lastError = chrome.runtime.lastError;
  if (lastError) {
    console.warn(lastError);
    notify(lastError.message);
  }
});
chrome.action.onClicked.addListener(tab => onClicked(tab.id, {
  allFrames: true
}));

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'status') {
    chrome.scripting.executeScript({
      target: {
        tabId: sender.tab.id
      },
      func: () => window.pointers.status
    }, r => response(r[0]?.result));

    return true;
  }
  else if (request.method === 'inject') {
    if (sender.frameId === 0) {
      chrome.action.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': '/data/icons/active/16.png',
          '32': '/data/icons/active/32.png',
          '48': '/data/icons/active/48.png'
        }
      });
    }
    for (const file of request.files) {
      chrome.scripting.executeScript({
        target: {
          tabId: sender.tab.id,
          frameIds: [sender.frameId]
        },
        files: ['/data/inject/' + file]
      });
    }
  }
  else if (request.method === 'release') {
    if (sender.frameId === 0) {
      chrome.action.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': '/data/icons/16.png',
          '32': '/data/icons/32.png',
          '48': '/data/icons/48.png'
        }
      });
    }
  }
  else if (request.method === 'inject-unprotected') {
    chrome.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [sender.frameId]
      },
      func: code => {
        const script = document.createElement('script');
        script.classList.add('arclck');
        script.textContent = 'document.currentScript.dataset.injected = true;' + code;
        document.documentElement.appendChild(script);
        if (script.dataset.injected !== 'true') {
          const s = document.createElement('script');
          s.classList.add('arclck');
          s.src = 'data:text/javascript;charset=utf-8;base64,' + btoa(code);
          document.documentElement.appendChild(s);
          script.remove();
        }
      },
      args: [request.code],
      world: 'MAIN'
    });
  }
  else if (request.method === 'simulate-click') {
    onClicked(sender.tab.id, {
      frameIds: [sender.frameId]
    });
  }
});

// automation
{
  const observe = () => chrome.storage.local.get({
    monitor: false,
    hostnames: []
  }, async prefs => {
    await chrome.scripting.unregisterContentScripts();

    if (prefs.monitor && prefs.hostnames.length) {
      const matches = new Set();
      for (const hostname of prefs.hostnames) {
        if (hostname.includes('*')) {
          matches.add(hostname);
        }
        else {
          matches.add(hostname);
          matches.add(hostname);
        }
      }
      for (let m of matches) {
        if (m.includes(':') === false) {
          m = '*://' + m;
        }
        if (m.endsWith('*') === false) {
          if (m.endsWith('/')) {
            m += '*';
          }
          else {
            m += '/*';
          }
        }
        const id = (Math.random() + 1).toString(36).substring(7);
        chrome.scripting.registerContentScripts([{
          allFrames: true,
          matchOriginAsFallback: true,
          runAt: 'document_start',
          id: 'monitor-' + id,
          js: ['/data/monitor.js'],
          matches: [m]
        }]).catch(e => {
          console.error(e);
          notify(g('bg_e_1') + `: ${m}:` + e.message);
        });
      }
    }
  });
  observe();
  chrome.storage.onChanged.addListener(prefs => {
    if (
      (prefs.monitor && prefs.monitor.newValue !== prefs.monitor.oldValue) ||
      (prefs.hostnames && prefs.hostnames.newValue !== prefs.hostnames.oldValue)
    ) {
      observe();
    }
    if (prefs.monitor) {
      permission();
    }
  });
}

// permission
const permission = () => chrome.permissions.contains({
  origins: ['*://*/*']
}, granted => {
  chrome.contextMenus.update('inject-sub', {
    enabled: granted === false,
    title: g('bg_context_1') + (granted ? ' ' + g('bg_context_2') : '')
  });
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
