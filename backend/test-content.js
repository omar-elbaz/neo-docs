// Test the applyOperationToContent function
function applyOperationToContent(currentContent, operation) {
  if (\!currentContent) {
    currentContent = {
      type: "doc",
      content: [
        {
          type: "paragraph", 
          content: []
        }
      ]
    };
  }

  console.log("Starting content:", JSON.stringify(currentContent));

  try {
    if (operation.steps && operation.steps.length > 0) {
      let insertedText = "";
      
      for (const step of operation.steps) {
        console.log("Step:", JSON.stringify(step));
        if (step.stepType === "replace" && step.slice && step.slice.content) {
          for (const node of step.slice.content) {
            if (node.type === "text" && node.text) {
              insertedText += node.text;
              console.log("Found text:", node.text);
            }
          }
        }
      }

      if (insertedText) {
        const paragraph = currentContent.content[0];
        if (\!paragraph.content) paragraph.content = [];
        
        let textNode = paragraph.content.find(n => n.type === "text");
        if (textNode) {
          textNode.text += insertedText;
        } else {
          paragraph.content.push({
            type: "text",
            text: insertedText
          });
        }
        console.log("Added text:", insertedText);
      }
    }

    console.log("Final content:", JSON.stringify(currentContent));
    return currentContent;
  } catch (error) {
    console.error("Error:", error);
    return currentContent;
  }
}

// Test
const testOp = {
  steps: [{
    stepType: "replace",
    from: 0,
    to: 0,
    slice: {
      content: [{
        type: "text",
        text: "hello"
      }]
    }
  }]
};

const result = applyOperationToContent(null, testOp);
console.log("Result:", JSON.stringify(result, null, 2));
