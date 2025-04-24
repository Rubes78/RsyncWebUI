
async function loadHistory() {
  const res = await fetch('/history');
  const jobs = await res.json();
  const table = document.getElementById('historyTable');
  table.innerHTML = jobs.map(job => `
    <div>
      <strong>${new Date(job.timestamp).toLocaleString()}</strong><br>
      ${job.source} → ${job.destination} (${job.options})<br>
      <button onclick="rerunJob('${job.source}', '${job.destination}', '${job.options}')">Re-run</button>
      <hr>
    </div>
  `).join('');
}

async function rerunJob(source, destination, options) {
  document.getElementById('sourcePath').value = source;
  document.getElementById('destPath').value = destination;
  document.getElementById('rsyncOptions').value = options;
  document.getElementById('rsyncForm').dispatchEvent(new Event('submit'));
}

document.getElementById('rsyncForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const panel = document.getElementById('statusPanel');
  panel.innerText = "Syncing...";
  const formData = new FormData(this);
  const res = await fetch('/run_rsync', { method: 'POST', body: formData });
  const result = await res.json();
  document.getElementById('rsyncOutput').innerText = result.stdout + "\n" + result.stderr;
  panel.innerText = "Job Completed";
  loadHistory();
});

window.onload = loadHistory;
