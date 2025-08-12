'use strict';

const toast = document.getElementById('toast');
const notify = (msg, timeout = 2000) => new Promise(resolve => {
  if (notify.resolve) {
    notify.resolve();
  }
  clearTimeout(notify.id);
  toast.textContent = msg;
  notify.id = setTimeout(() => {
    toast.textContent = '';
    resolve();
    delete notify.resolve;
  }, timeout);
  notify.resolve = resolve;
});

chrome.storage.local.get({
  'hostnames': []
}, prefs => {
  document.getElementById('whitelist').value = prefs.hostnames.join(', ');
});

document.getElementById('save').addEventListener('click', async () => {
  const matches = document.getElementById('whitelist').value.split(/\s*,\s*/)
    .map(s => s = s.trim()).filter((s, i, l) => s && l.indexOf(s) === i);

  const hostnames = [];
  // make sure the provided list is working
  for (const hostname of matches) {
    let m = hostname;
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
    try {
      await chrome.scripting.registerContentScripts([{
        id: 'test',
        matchOriginAsFallback: true,
        js: ['/data/inject/test.js'],
        matches: [m]
      }]);
      hostnames.push(hostname);
    }
    catch (e) {
      console.error(e);
      await notify(`[Invalid Pattern] ${m} → ` + e.message, 6000);
    }
    await chrome.scripting.unregisterContentScripts({ids: ['test']}).catch(() => {});
  }

  chrome.storage.local.set({
    'monitor': hostnames.length > 0,
    hostnames
  });
  document.getElementById('whitelist').value = hostnames.join(', ');
  notify('Options saved');
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    notify('Double-click to reset!');
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.permissions.remove({
        origins: ['*://*/*']
      }, () => {
        chrome.runtime.reload();
        window.close();
      });
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

//
const check = () => chrome.permissions.contains({
  origins: ['*://*/*']
}, granted => {
  document.getElementById('whitelist').disabled = granted === false;
  document.getElementById('hostaccess').checked = granted;
});
check();

document.getElementById('hostaccess').onchange = e => {
  if (e.target.checked) {
    chrome.permissions.request({
      origins: ['*://*/*']
    }, granted => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        notify(lastError.message);
      }

      document.getElementById('whitelist').disabled = granted === false;
      document.getElementById('hostaccess').checked = granted;
      chrome.storage.local.set({
        monitor: granted
      });

      check();
    });
  }
  else {
    document.getElementById('whitelist').disabled = true;
    chrome.permissions.remove({
      origins: ['*://*/*']
    });
  }
};
document.getElementById('subframe').onclick = () => {
  chrome.permissions.request({
    origins: ['*://*/*']
  }, granted => {
    const lastError = chrome.runtime.lastError;

    if (lastError) {
      notify(lastError.message);
    }
    else {
      notify(granted ? 'Permission granted' : 'Permission denied');
    }
    check();
  });
};
document.getElementById('no-subframe').onclick = () => {
  chrome.permissions.remove({
    origins: ['*://*/*']
  }, granted => {
    const lastError = chrome.runtime.lastError;

    if (lastError) {
      notify(lastError.message);
    }
    else {
      notify('Permission removed');
    }
    check();
  });
};

// links
for (const a of [...document.querySelectorAll('[data-href]')]) {
  if (a.hasAttribute('href') === false) {
    a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
  }
}

// home
document.getElementById('home').onclick = () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url
});
