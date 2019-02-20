'use strict';

var keys = Object.keys(localStorage).filter(k => k.startsWith('hostname:'));

document.getElementById('whitelist').value = keys.map(key => key.replace('hostname:', '')).join(', ');

document.getElementById('save').addEventListener('click', () => {
  keys.forEach(key => localStorage.removeItem(key));
  const hostnames = document.getElementById('whitelist').value.split(/\s*,\s*/).filter(s => s);

  hostnames.forEach(hostname => {
    localStorage.setItem('hostname:' + hostname, true);
  });
  chrome.storage.local.set({
    'monitor': hostnames.length > 0
  });
  document.getElementById('whitelist').value = hostnames.join(', ');
  const toast = document.getElementById('toast');
  toast.textContent = 'Options saved';
  window.setTimeout(() => toast.textContent = '', 2000);
});
