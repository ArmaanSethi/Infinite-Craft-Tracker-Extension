// Store initial state of divs
initialDivStates = {};
saved_words = [];
historical_log = [];
merged_elements = [];

const elementGraph = {};

function addCombination(element1, element2, result) {
  // console.log('addCombination', element1, element2, result);

  // 1. Initialize elements if they don't exist
  elementGraph[element1] = elementGraph[element1] || { parents: {}, children: new Set() };
  elementGraph[element2] = elementGraph[element2] || { parents: {}, children: new Set() };
  elementGraph[result] = elementGraph[result] || { parents: {}, children: new Set() };

  // 2. Record the 'parents' of the result
  // Initialize parent sets ONLY if the key doesn't exist
  if (!elementGraph[result].parents[element1]) {
    elementGraph[result].parents[element1] = new Set();
  }
  if (!elementGraph[result].parents[element2]) {
    elementGraph[result].parents[element2] = new Set();
  }

  // Add elements to respective sets
  elementGraph[result].parents[element1].add(element2);
  // Add symmetric result to elementGraph
  // elementGraph[result].parents[element2].add(element1);

  // 3. Update 'children' lists
  elementGraph[element1].children.add(result);
  elementGraph[element2].children.add(result);
  console.log(Object.keys(elementGraph[result].parents).length);
  // (TODO) Check that parents length is > 0.
  console.log(elementGraph);
}

const targetDivs = document.querySelector('.instances > div').querySelectorAll('.item.instance');

targetDivs.forEach(div => {
  initialDivStates[div.id || div.className] = div.textContent;
});

const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      // console.log("mutationttarget: ", mutation);
      handleDivChange(mutation);
    }
  });
});

mutationObserver.observe(document.querySelector('.instances > div'), {
  childList: true,
  subtree: true
});

// Check if removedNodes exist in the MutationRecord and returns the element.
function hasClassInRemovedNodes(mutationRecord, className) {
  if (mutationRecord.removedNodes) {
    // Iterate over each removed node
    for (let i = 0; i < mutationRecord.removedNodes.length; i++) {
      const node = mutationRecord.removedNodes[i];

      // Check if the node has the specified class
      // console.log("classlist", node.classList);
      if (node.classList && node.classList.contains(className)) {
        return node.textContent.replace(/\t|\s{2,}|^\s|\s$/g, '');
      }
    }
  }

  // If removedNodes doesn't exist or the class wasn't found
  return false;
}

function getLastElementOfLastArray(nestedArray) {
  return nestedArray.flat(Infinity).at(-1);
}

function convertToCSV(data) {
  let csv = 'New Element,Element,Element\n';
  for (const key in data) {
    const element1 = key;
    const parents = data[key].parents;
    for (const parentKey in parents) {
      const element2 = parentKey;
      const element3Set = parents[parentKey];
      element3Set.forEach(element3 => {
        csv += `${element1},${element2},${element3}\n`;
      });
    }
  }
  console.log("CSV\n", csv);

  return csv;
}

async function handleDivChange(mutation) {
  const changedDiv = mutation.target;
  const key = changedDiv.id || changedDiv.className;
  const oldContent = initialDivStates[key] || ''; // Get previous content for better diff
  const newContent = changedDiv.textContent;

  const diff = improvedDiff(newContent);

  // Update initial state to ensure next diff is calculated correctly
  initialDivStates[key] = newContent;

  diff.additions.shift();
  // console.log("current:", diff.additions.length, diff.additions);
  await addDiffToLog(diff.additions, historical_log, mutation); // Ensure logging completes, use await
  // Send a message to the background script with the variable value
  let outputVariable = convertToCSV(elementGraph);
  chrome.runtime.sendMessage({ action: "sendVariable", variableValue: outputVariable });
}

function improvedDiff(newContent) {
  const newWords = newContent.split(/\r?\n/);

  const diffResult = {
    additions: [],
    deletions: []
  };

  for (let i = 0; i < newWords.length; i += 2) {
    if (newWords[i] !== undefined && newWords[i + 1] !== undefined) {
      combinedString = newWords[i].replace(/\t|\s{2,}|^\s|\s$/g, '') + newWords[i + 1].replace(/\t|\s{2,}|^\s|\s$/g, '');
      diffResult.additions.push(combinedString);
    }
  }
  return diffResult;
}

function newElement(lastLog) {
  return lastLog.find(element => !elementGraph.has(element));
}

async function addDiffToLog(diffAdditions, historicalLog, mutation) {
  // 1. Handle edge cases:
  if (!historicalLog || historicalLog.length === 0) {
    historicalLog.push(diffAdditions); // Add if log is empty 
    return;
  }

  // 2. Get the last entry in the log
  const lastLog = historicalLog[historicalLog.length - 1];

  // 3. Compare for deep equality (element-wise)
  if (!arraysEqual(diffAdditions, lastLog)) {
    historicalLog.push(diffAdditions);
  }

  const disabled_instance = hasClassInRemovedNodes(mutation, "instance-disabled");
  // console.log("disabled_instance", disabled_instance);
  if (disabled_instance) {
    merged_elements.push(disabled_instance);
  }
  if (merged_elements.length == 2) {
    addCombination(merged_elements[0], merged_elements[1], getLastElementOfLastArray(historicalLog));
    merged_elements = [];
  }
}

// Helper function for deep array comparison
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true; // All elements matched
}
