
async function loadHistory() {
  const res = await fetch('/history');
  const jobs = await res.json();
  const tableBody = document.querySelector('#historyTable tbody');

  // Sort by most recent first
  jobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tableBody.innerHTML = jobs.map(job => `
    <tr>
      <td>${new Date(job.timestamp).toLocaleString()}</td>
      <td>${job.source}</td>
      <td>${job.destination}</td>
      <td>${job.options}</td>
      <td><button onclick="rerunJob('${job.source}', '${job.destination}', '${job.options}')">Re-run</button></td>
    </tr>
  `).join('');

  console.log("Highlighting most recent row...");

  const firstRow = tableBody.querySelector('tr');
  if (firstRow) {
    tableBody.querySelectorAll('tr').forEach(row => row.classList.remove('highlight'));
    firstRow.classList.add('highlight');
    console.log("Applied .highlight class to:", firstRow);
  } else {
    console.log("No row found to highlight.");
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
  document.getElementById('rsyncOutput').innerText = result.stdout + "\n" + result.stderr;

  panel.innerText = "Job Completed";
  const now = new Date();
  const formatted = now.toLocaleTimeString();
  const notification = document.getElementById('notificationBar');
  notification.className = 'success';
  notification.innerText = `✅ Synced: ${source} → ${destination} at ${formatted}`;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 10000);

  loadHistory();
});

window.onload = function() {
  loadSavedPaths();
  loadHistory();
};
