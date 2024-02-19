console.log("popup.js");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("popup.js listener");

    if (message.from === 'content' && message.variableValue) {
        console.log("popup.js if");

        document.getElementById('messageArea').textContent = message.variableValue;
    }
});
