/* global g, permission, notify */
{
  const once = () => {
    if (once.installed) {
      return;
    }
    once.installed = true;
    chrome.contextMenus.create({
      id: 'add-to-whitelist',
      title: g('bg_context_3'),
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'remove-from-whitelist',
      title: g('bg_context_7'),
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'inject-sub',
      title: g('bg_context_4'),
      contexts: ['action']
    }, () => {
      chrome.runtime.lastError;
      permission();
    });
    chrome.contextMenus.create({
      id: 'test',
      title: g('bg_context_5'),
      contexts: ['action']
    });
    if (/Firefox/.test(navigator.userAgent)) {
      chrome.contextMenus.create({
        id: 'sep',
        contexts: ['action'],
        type: 'separator'
      });
      chrome.contextMenus.create({
        id: 'options',
        title: g('bg_context_6'),
        contexts: ['action']
      });
    }
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'options') {
    chrome.runtime.openOptionsPage();
  }
  else if (info.menuItemId === 'test') {
    chrome.tabs.create({
      url: 'https://webbrowsertools.com/test-right-click',
      index: tab.index + 1
    });
  }
  else if (info.menuItemId === 'inject-sub') {
    chrome.permissions.request({
      origins: ['*://*/*']
    }, permission);
  }
  else if (info.menuItemId === 'add-to-whitelist') {
    const url = tab.url || info.pageUrl || '';
    if (url.startsWith('http')) {
      chrome.permissions.contains({
        origins: ['*://*/*']
      }, granted => {
        const {hostname} = new URL(url);
        chrome.storage.local.get({
          hostnames: []
        }, prefs => {
          chrome.storage.local.set({
            hostnames: [...prefs.hostnames, hostname].filter((s, i, l) => s && l.indexOf(s) === i)
          }, () => {
            if (granted) {
              chrome.storage.local.set({
                monitor: true
              });
              notify(g('bg_msg_2', [hostname]));
              chrome.tabs.reload(tab.id);
            }
            else {
              notify(g('bg_msg_1'));
              setTimeout(() => chrome.runtime.openOptionsPage(), 3000);
            }
          });
        });
      });
    }
    else {
      notify(g('bg_e_2') + ': ' + url);
    }
  }
  else if (info.menuItemId === 'remove-from-whitelist') {
    const url = tab.url || info.pageUrl;
    if (url.startsWith('http')) {
      const {hostname} = new URL(url);
      chrome.storage.local.get({
        hostnames: []
      }, prefs => {
        chrome.storage.local.set({
          hostnames: prefs.hostnames.filter(s => s !== hostname)
        }, () => {
          notify(g('bg_msg_3', [hostname]));
          chrome.tabs.reload(tab.id);
        });
      });
    }
    else {
      notify(g('bg_e_2') + ': ' + url);
    }
  }
});
