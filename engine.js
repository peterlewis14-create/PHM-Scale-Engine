// Simple starter to prove the browser version works

function start() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Question 1: What is the design stage?</h2>
    <button onclick="choose('Concept')">Concept</button>
    <button onclick="choose('Preliminary')">Preliminary</button>
    <button onclick="choose('Detailed')">Detailed</button>
  `;
}

function choose(answer) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <p>You selected: <strong>${answer}</strong></p>
    <p>This proves the prototype is working.</p>
    <button onclick="start()">Restart</button>
  `;
}
