// background.js (or your service worker file)
console.log("background.js");
chrome.action.onClicked.addListener(() => {
    console.log("background.js listen");
    // Here you can either:
    // a) Directly perform an action (if possible)
    // b) Send a message back to your content script to trigger an action there
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("background.js query");
        chrome.tabs.sendMessage(tabs[0].id, { action: "iconClicked" });
    });
});