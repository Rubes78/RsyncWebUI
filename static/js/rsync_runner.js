let selectedJobs = new Set();
let showOutput = true;

async function loadHistory() {
  const res = await fetch('/history');
  const jobs = await res.json();
  const tableBody = document.querySelector('#historyTable tbody');

  jobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tableBody.innerHTML = jobs.map((job, index) => {
    const jobId = "job" + index;
    const rowClass = index === 0 && job.returncode !== 0 ? 'error-highlight' : (index === 0 ? 'highlight' : '');
    return `
      <tr class="${rowClass}">
        <td><input type="checkbox" onchange="toggleSelectJob(${index})" ${selectedJobs.has(index) ? 'checked' : ''}></td>
        <td>${new Date(job.timestamp).toLocaleString()}</td>
        <td>${job.source}</td>
        <td>${job.destination}</td>
        <td>${job.options}</td>
        <td>
          <button onclick="rerunJob('${job.source}', '${job.destination}', '${job.options}')">Re-run</button>
          <button onclick="toggleDetails('${jobId}')">View Details</button>
        </td>
      </tr>
      <tr id="${jobId}" style="display:none;">
        <td colspan="6"><pre>${job.stdout + "\n" + job.stderr}</pre></td>
      </tr>
    `;
  }).join('');
}

function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll('#historyTable tbody input[type="checkbox"]');
  selectedJobs.clear();
  checkboxes.forEach((cb, index) => {
    cb.checked = checkbox.checked;
    if (checkbox.checked) selectedJobs.add(index);
  });
}

async function deleteSelectedJobs() {
  const res = await fetch('/history');
  let jobs = await res.json();
  jobs = jobs.filter((_, index) => !selectedJobs.has(index));
  await fetch('/history', { 
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(jobs)
  });
  selectedJobs.clear();
  loadHistory();
}

function toggleSelectJob(index) {
  if (selectedJobs.has(index)) {
    selectedJobs.delete(index);
  } else {
    selectedJobs.add(index);
  }
}

function toggleDetails(id) {
  const row = document.getElementById(id);
  if (row) {
    row.style.display = (row.style.display === 'none' || row.style.display === '') ? 'table-row' : 'none';
  }
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

function toggleOutputPanel() {
  const outputPanel = document.getElementById('rsyncOutput');
  showOutput = !showOutput;
  outputPanel.style.display = showOutput ? 'block' : 'none';
  document.getElementById('toggleOutputBtn').innerText = showOutput ? "Hide Output" : "Show Output";
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
  const formData = new FormData(this);
  const res = await fetch('/run_rsync', { method: 'POST', body: formData });
  const result = await res.json();

  const outputArea = document.getElementById('rsyncOutput');
  const combinedOutput = (result.stdout + "\n" + result.stderr).split("\n");
  if (combinedOutput.length > 100) {
    outputArea.innerText = combinedOutput.slice(-100).join("\n");
  } else {
    outputArea.innerText = combinedOutput.join("\n");
  }

  panel.innerText = "Job Completed";

  const notification = document.getElementById('notificationBar');
  const now = new Date();
  const formatted = now.toLocaleTimeString();
  
  if (result.returncode === 0) {
    notification.className = 'success';
    notification.innerText = `✅ Synced: ${source} → ${destination} at ${formatted}`;
  } else {
    notification.className = 'error';
    notification.innerText = `❌ Sync failed: ${result.stderr || "Unknown error"}`;
  }
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 10000);

  loadHistory();
});

window.onload = function() {
  loadSavedPaths();
  loadHistory();
};
