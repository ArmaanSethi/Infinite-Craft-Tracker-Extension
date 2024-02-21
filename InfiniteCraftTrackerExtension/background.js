// background.js

chrome.runtime.onInstalled.addListener(() => {
    // Perform initialization tasks here
    console.log("Extension initialized.");
    // You can also set default values or perform other setup tasks here
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendVariable") {
        // Relay the message to the popup script
        chrome.runtime.sendMessage({ action: "updatePopup", variableValue: request.variableValue });
    }
});
