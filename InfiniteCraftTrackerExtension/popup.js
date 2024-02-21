// popup.js

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updatePopup") {
        // Update the HTML with the variable value
        document.getElementById("output").innerText = request.variableValue;
    }
});
