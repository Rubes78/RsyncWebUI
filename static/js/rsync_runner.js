
let logVisible = true;

async function loadHistory() {
  const res = await fetch('/history');
  const jobs = await res.json();
  const tableBody = document.querySelector('#historyTable tbody');

  jobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tableBody.innerHTML = jobs.map((job, index) => {
    const rowClass = index === 0 && job.returncode !== 0 ? 'error-highlight' : (index === 0 ? 'highlight' : '');
    const detailId = `details-${index}`;
    return `
      <tr class="${rowClass}">
        <td><input type="checkbox" class="history-checkbox" data-index="${index}"></td>
        <td>${new Date(job.timestamp).toLocaleString()}</td>
        <td>${job.source}</td>
        <td>${job.destination}</td>
        <td>${job.options}</td>
        <td>
          <button onclick="rerunJob('${job.source}', '${job.destination}', '${job.options}')">Re-run</button><br>
          <button onclick="toggleDetails('${detailId}')">View Details</button>
        </td>
      </tr>
      <tr id="${detailId}" class="details-content" style="display: none;">
        <td colspan="6">
          <div><strong>Output:</strong><br>${job.stdout || "No output"}</div>
          <div><strong>Error:</strong><br>${job.stderr || "None"}</div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteSelectedHistory() {
  const checked = Array.from(document.querySelectorAll('.history-checkbox:checked'));
  const indices = checked.map(cb => parseInt(cb.getAttribute('data-index')));
  if (indices.length === 0) {
    alert("No entries selected.");
    return;
  }

  const confirmDelete = confirm(`Delete ${indices.length} selected entr${indices.length === 1 ? 'y' : 'ies'}?`);
  if (!confirmDelete) return;

  await fetch('/delete_history', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ indices })
  });

  loadHistory();
}

async function loadSavedPaths() {
  const res = await fetch('/paths');
  const paths = await res.json();
  document.getElementById('sourcePath').value = paths.source || '';
  document.getElementById('destPath').value = paths.destination || '';
}

function rerunJob(source, destination, options) {
  document.getElementById('sourcePath').value = source;
  document.getElementById('destPath').value = destination;
  document.getElementById('rsyncOptions').value = options;
  document.getElementById('rsyncForm').dispatchEvent(new Event('submit'));
}

document.getElementById('rsyncForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const source = document.getElementById('sourcePath').value;
  const destination = document.getElementById('destPath').value;

  await fetch('/paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination })
  });

  const panel = document.getElementById('statusPanel');
  panel.innerText = "Syncing...";
  const output = document.getElementById('rsyncOutput');
  const formData = new FormData(this);

  const res = await fetch('/run_rsync_stream', { method: 'POST', body: formData });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let logLines = [];

  output.innerText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const newLines = chunk.split("\n");
    logLines.push(...newLines);
    if (logLines.length > 100) logLines = logLines.slice(-100);
    if (logVisible) {
      output.innerText = logLines.join("\n");
      output.scrollTop = output.scrollHeight;
    }
  }

  if (logVisible) {
    output.innerText = logLines.join("\n");
    output.scrollTop = output.scrollHeight;
  }

  panel.innerText = "Job Completed";
  const now = new Date();
  const formatted = now.toLocaleTimeString();
  const notification = document.getElementById('notificationBar');
  notification.className = 'success';
  notification.innerText = `✅ Sync complete at ${formatted}`;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 10000);

  loadHistory();
});

function toggleDetails(id) {
  const row = document.getElementById(id);
  row.style.display = (row.style.display === 'table-row') ? 'none' : 'table-row';
}

function toggleOutputVisibility() {
  const output = document.getElementById('rsyncOutput');
  const toggle = document.getElementById('outputToggle');
  logVisible = !logVisible;
  output.style.display = logVisible ? "block" : "none";
  toggle.innerText = logVisible ? "Hide Sync Log" : "Show Sync Log";
}

window.onload = function() {
  loadSavedPaths();
  loadHistory();

  const outputToggle = document.createElement("button");
  outputToggle.innerText = "Hide Sync Log";
  outputToggle.id = "outputToggle";
  outputToggle.onclick = toggleOutputVisibility;
  document.getElementById("rsyncOutput").insertAdjacentElement("beforebegin", outputToggle);

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Delete Selected";
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.onclick = deleteSelectedHistory;
  document.getElementById("historyTable").insertAdjacentElement("beforebegin", deleteBtn);
};
