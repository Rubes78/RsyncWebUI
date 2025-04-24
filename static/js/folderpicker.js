
let targetInput = null;

function openBrowser(inputId) {
  targetInput = document.getElementById(inputId);
  showBrowser("/");
}

async function showBrowser(path) {
  const res = await fetch(`/browse?path=${encodeURIComponent(path)}`);
  const data = await res.json();
  if (data.error) {
    alert("Error: " + data.error);
    return;
  }

  let html = `<div><strong>Current: ${data.current}</strong></div>`;
  if (data.current !== "/") {
    const parent = data.current.split("/").slice(0, -1).join("/") || "/";
    html += `<div><a href="#" onclick="showBrowser('${parent}')">.. (Up)</a></div>`;
  }

  data.contents.forEach(item => {
    const fullPath = `${data.current.replace(/\/$/, "")}/${item.name}`;
    if (item.is_dir) {
      html += `<div><a href="#" onclick="showBrowser('${fullPath}')">${item.name}/</a></div>`;
    } else {
      html += `<div>${item.name}</div>`;
    }
  });

  html += `<button onclick="selectPath('${data.current}')">Select This Folder</button>`;
  document.getElementById("browserModal").innerHTML = html;
  document.getElementById("browserModal").style.display = "block";
}

function selectPath(path) {
  if (targetInput) {
    targetInput.value = path;
  }
  document.getElementById("browserModal").style.display = "none";
}
