'use strict';

chrome.browserAction.onClicked.addListener(tab => chrome.tabs.executeScript(tab.id, {
  allFrames: true,
  matchAboutBlank: true,
  code: `{
    const script = document.createElement('script');
    script.textContent = 'document.oncopy = document.onpaste = document.oncontextmenu = null;';
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  }`,
  runAt: 'document_start'
}));
