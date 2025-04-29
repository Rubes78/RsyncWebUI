// Global variables
let scheduledJobs = [];

// Initialize the page
window.onload = function() {
  loadSavedPaths();
  loadScheduledJobs();
  setupEventListeners();
  
  // Set default datetime to now + 1 hour
  const now = new Date();
  now.setHours(now.getHours() + 1);
  document.getElementById('scheduleDateTime').value = formatDateTimeForInput(now);
  
  // Add delete button
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (!deleteBtn) {
    const newDeleteBtn = document.createElement("button");
    newDeleteBtn.innerText = "Delete Selected";
    newDeleteBtn.id = "deleteSelectedBtn";
    newDeleteBtn.onclick = deleteSelectedSchedules;
    document.getElementById("scheduledJobsTable").insertAdjacentElement("afterend", newDeleteBtn);
  }
};

// Setup event listeners
function setupEventListeners() {
  // Schedule form submission
  document.getElementById('scheduleForm').addEventListener('submit', scheduleJob);
  
  // Schedule type radio buttons
  document.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
    radio.addEventListener('change', toggleScheduleOptions);
  });
  
  // Frequency dropdown
  document.getElementById('frequency').addEventListener('change', toggleFrequencyOptions);
}

// Toggle between once and recurring schedule options
function toggleScheduleOptions() {
  const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
  
  if (scheduleType === 'once') {
    document.getElementById('onceOptions').style.display = 'block';
    document.getElementById('recurringOptions').style.display = 'none';
  } else {
    document.getElementById('onceOptions').style.display = 'none';
    document.getElementById('recurringOptions').style.display = 'block';
    toggleFrequencyOptions(); // Make sure the correct frequency options are shown
  }
}

// Toggle between different frequency options
function toggleFrequencyOptions() {
  const frequency = document.getElementById('frequency').value;
  
  // Hide all frequency option divs
  document.querySelectorAll('.frequency-options').forEach(div => {
    div.style.display = 'none';
  });
  
  // Show the selected frequency options
  document.getElementById(`${frequency}Options`).style.display = 'block';
}

// Load saved paths from server
async function loadSavedPaths() {
  try {
    const res = await fetch('/paths');
    const paths = await res.json();
    document.getElementById('sourcePath').value = paths.source || '';
    document.getElementById('destPath').value = paths.destination || '';
  } catch (error) {
    console.error('Error loading saved paths:', error);
  }
}

// Load scheduled jobs from server
async function loadScheduledJobs() {
  try {
    const res = await fetch('/scheduled_jobs');
    scheduledJobs = await res.json();
    displayScheduledJobs();
  } catch (error) {
    console.error('Error loading scheduled jobs:', error);
  }
}

// Display scheduled jobs in the table
function displayScheduledJobs() {
  const tableBody = document.querySelector('#scheduledJobsTable tbody');
  
  if (scheduledJobs.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No scheduled jobs</td></tr>';
    return;
  }
  
  tableBody.innerHTML = scheduledJobs.map((job, index) => {
    const nextRun = calculateNextRun(job);
    const scheduleDescription = formatScheduleDescription(job);
    
    return `
      <tr>
        <td><input type="checkbox" class="schedule-checkbox" data-id="${job.id}"></td>
        <td>${job.source}</td>
        <td>${job.destination}</td>
        <td>${job.options}</td>
        <td>${scheduleDescription}</td>
        <td>${nextRun}</td>
        <td>
          <button onclick="editSchedule('${job.id}')">Edit</button>
          <button onclick="deleteSchedule('${job.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Format schedule description for display
function formatScheduleDescription(job) {
  if (job.scheduleType === 'once') {
    return `Once at ${new Date(job.scheduleDateTime).toLocaleString()}`;
  } else {
    switch (job.frequency) {
      case 'hourly':
        return `Every ${job.hourlyInterval} hour(s)`;
      case 'daily':
        return `Every ${job.dailyInterval} day(s) at ${job.dailyTime}`;
      case 'weekly':
        const days = job.weekdays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]);
        return `Weekly on ${days.join(', ')} at ${job.weeklyTime}`;
      case 'monthly':
        return `Monthly on day ${job.monthDay} at ${job.monthlyTime}`;
      default:
        return 'Unknown schedule';
    }
  }
}

// Calculate next run time for a job
function calculateNextRun(job) {
  // For demonstration purposes, just return a placeholder
  // In a real implementation, this would calculate the actual next run time
  if (job.scheduleType === 'once') {
    return new Date(job.scheduleDateTime).toLocaleString();
  } else {
    return 'Calculating...';
  }
}

// Schedule a new job
async function scheduleJob(e) {
  e.preventDefault();
  
  const source = document.getElementById('sourcePath').value;
  const destination = document.getElementById('destPath').value;
  const options = document.getElementById('rsyncOptions').value;
  const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
  
  // Create job object
  const job = {
    source,
    destination,
    options,
    scheduleType
  };
  
  // Add schedule-specific properties
  if (scheduleType === 'once') {
    job.scheduleDateTime = document.getElementById('scheduleDateTime').value;
  } else {
    const frequency = document.getElementById('frequency').value;
    job.frequency = frequency;
    
    switch (frequency) {
      case 'hourly':
        job.hourlyInterval = document.getElementById('hourlyInterval').value;
        break;
      case 'daily':
        job.dailyInterval = document.getElementById('dailyInterval').value;
        job.dailyTime = document.getElementById('dailyTime').value;
        break;
      case 'weekly':
        job.weeklyInterval = document.getElementById('weeklyInterval').value;
        job.weekdays = Array.from(document.querySelectorAll('input[name="weekday"]:checked')).map(cb => cb.value);
        job.weeklyTime = document.getElementById('weeklyTime').value;
        break;
      case 'monthly':
        job.monthDay = document.getElementById('monthDay').value;
        job.monthlyTime = document.getElementById('monthlyTime').value;
        break;
    }
  }
  
  try {
    const res = await fetch('/schedule_job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    
    const result = await res.json();
    
    if (result.success) {
      showNotification('Job scheduled successfully!', 'success');
      loadScheduledJobs(); // Reload the jobs list
    } else {
      showNotification(`Failed to schedule job: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error scheduling job:', error);
    showNotification('Error scheduling job. Please try again.', 'error');
  }
}

// Delete a scheduled job
async function deleteSchedule(id) {
  if (!confirm('Are you sure you want to delete this scheduled job?')) {
    return;
  }
  
  try {
    const res = await fetch('/delete_scheduled_job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    
    const result = await res.json();
    
    if (result.success) {
      showNotification('Job deleted successfully!', 'success');
      loadScheduledJobs(); // Reload the jobs list
    } else {
      showNotification(`Failed to delete job: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    showNotification('Error deleting job. Please try again.', 'error');
  }
}

// Delete selected scheduled jobs
async function deleteSelectedSchedules() {
  const checked = Array.from(document.querySelectorAll('.schedule-checkbox:checked'));
  
  if (checked.length === 0) {
    alert('No jobs selected.');
    return;
  }
  
  if (!confirm(`Delete ${checked.length} selected job(s)?`)) {
    return;
  }
  
  const ids = checked.map(cb => cb.getAttribute('data-id'));
  
  try {
    const res = await fetch('/delete_scheduled_jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    
    const result = await res.json();
    
    if (result.success) {
      showNotification('Jobs deleted successfully!', 'success');
      loadScheduledJobs(); // Reload the jobs list
    } else {
      showNotification(`Failed to delete jobs: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting jobs:', error);
    showNotification('Error deleting jobs. Please try again.', 'error');
  }
}

// Edit a scheduled job (placeholder)
function editSchedule(id) {
  // Find the job
  const job = scheduledJobs.find(j => j.id === id);
  
  if (!job) {
    showNotification('Job not found', 'error');
    return;
  }
  
  // For now, just populate the form with the job details
  document.getElementById('sourcePath').value = job.source;
  document.getElementById('destPath').value = job.destination;
  document.getElementById('rsyncOptions').value = job.options;
  
  // Set schedule type
  document.querySelector(`input[name="scheduleType"][value="${job.scheduleType}"]`).checked = true;
  toggleScheduleOptions();
  
  // Set schedule-specific fields
  if (job.scheduleType === 'once') {
    document.getElementById('scheduleDateTime').value = job.scheduleDateTime;
  } else {
    document.getElementById('frequency').value = job.frequency;
    toggleFrequencyOptions();
    
    switch (job.frequency) {
      case 'hourly':
        document.getElementById('hourlyInterval').value = job.hourlyInterval;
        break;
      case 'daily':
        document.getElementById('dailyInterval').value = job.dailyInterval;
        document.getElementById('dailyTime').value = job.dailyTime;
        break;
      case 'weekly':
        document.getElementById('weeklyInterval').value = job.weeklyInterval;
        document.querySelectorAll('input[name="weekday"]').forEach(cb => {
          cb.checked = job.weekdays.includes(cb.value);
        });
        document.getElementById('weeklyTime').value = job.weeklyTime;
        break;
      case 'monthly':
        document.getElementById('monthDay').value = job.monthDay;
        document.getElementById('monthlyTime').value = job.monthlyTime;
        break;
    }
  }
  
  showNotification('Edit the form and submit to update the job', 'success');
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById('notificationBar');
  notification.innerText = message;
  notification.className = type;
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// Format date for datetime-local input
function formatDateTimeForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}