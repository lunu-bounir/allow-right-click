'use strict';

const toast = document.getElementById('toast');
const notify = msg => {
  clearTimeout(notify.id);
  toast.textContent = msg;
  notify.id = setTimeout(() => toast.textContent = '', 2000);
};

chrome.storage.local.get({
  'faqs': true,
  'hostnames': []
}, prefs => {
  document.getElementById('faqs').checked = prefs.faqs;
  document.getElementById('whitelist').value = prefs.hostnames.join(', ');
});

document.getElementById('save').addEventListener('click', () => {
  const hostnames = document.getElementById('whitelist').value.split(/\s*,\s*/).map(s => {
    s = s.trim();
    if (s && s.startsWith('http')) {
      try {
        return (new URL(s)).hostname;
      }
      catch (e) {
        console.log(e);
        return '';
      }
    }
    return s;
  }).filter((s, i, l) => s && l.indexOf(s) === i);

  chrome.storage.local.set({
    'monitor': hostnames.length > 0,
    'faqs': document.getElementById('faqs').checked,
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
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

//
chrome.permissions.contains({
  origins: ['*://*/*']
}, granted => {
  document.getElementById('whitelist').disabled = granted === false;
  document.getElementById('hostaccess').checked = granted;
});
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
    });
  }
  else {
    document.getElementById('whitelist').disabled = true;
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
  });
};
