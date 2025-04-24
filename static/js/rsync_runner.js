
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



async function loadSavedPaths() {
  const res = await fetch('/paths');
  const paths = await res.json();
  document.getElementById('sourcePath').value = paths.source || '';
  document.getElementById('destPath').value = paths.destination || '';
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
  loadHistory();
});


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

window.onload = function() {
  loadSavedPaths();
  loadHistory();
};
