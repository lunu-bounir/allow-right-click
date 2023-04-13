/* global g, permission, notify */
{
  const callback = () => {
    chrome.contextMenus.create({
      id: 'add-to-whitelist',
      title: g('bg_context_3'),
      contexts: ['action']
    }, () => chrome.runtime.lastError);
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
    }, () => chrome.runtime.lastError);
  };
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'test') {
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
  else {
    const url = tab.url || info.pageUrl;
    if (url.startsWith('http')) {
      const {hostname} = new URL(url);
      chrome.storage.local.get({
        hostnames: []
      }, prefs => {
        chrome.storage.local.set({
          hostnames: [...prefs.hostnames, hostname].filter((s, i, l) => s && l.indexOf(s) === i)
        });
      });

      chrome.permissions.contains({
        origins: ['*://*/*']
      }, granted => {
        if (granted) {
          chrome.storage.local.set({
            monitor: true
          });
          notify(`"${hostname}" is added to the list`);
        }
        else {
          notify(g('bg_msg_1'));
          setTimeout(() => chrome.runtime.openOptionsPage(), 3000);
        }
      });
    }
    else {
      notify(g('bg_e_2') + ': ' + url);
    }
  }
});
