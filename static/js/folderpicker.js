let currentFieldId = "";

function openBrowser(fieldId) {
  currentFieldId = fieldId;
  const path = document.getElementById(fieldId).value || "/";
  fetch("/browse?path=" + encodeURIComponent(path))
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error browsing: " + data.error);
        return;
      }
      const content = document.getElementById("browserContent");
      content.innerHTML = "";

      // Top controls
      addBrowserControls(content, data.current);

      const folderList = document.createElement("div");
      data.contents.forEach(item => {
        if (item.is_dir) {
          const base = data.current.endsWith("/") ? data.current.slice(0, -1) : data.current;
          const fullPath = base + "/" + item.name;
          const div = document.createElement("div");
          div.innerHTML = "<a href='#' onclick=\"openBrowserWithPath('"+fullPath+"')\">📁 " + item.name + "</a>";
          folderList.appendChild(div);
        }
      });
      content.appendChild(folderList);

      // Bottom controls
      addBrowserControls(content, data.current);

      document.getElementById("browserModal").style.display = "block";
    });
}

function addBrowserControls(container, currentPath) {
  const controls = document.createElement("div");
  controls.style.margin = "10px 0";
  controls.style.display = "flex";
  controls.style.gap = "10px"; /* <-- Corrected here */
  controls.style.flexWrap = "wrap";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = closeBrowserModal;
  controls.appendChild(cancelBtn);

  const useBtn = document.createElement("button");
  useBtn.textContent = "Use This Folder";
  useBtn.onclick = () => {
    document.getElementById(currentFieldId).value = currentPath;
    closeBrowserModal();
  };
  controls.appendChild(useBtn);

  const createBtn = document.createElement("button");
  createBtn.textContent = "Create New Folder";
  createBtn.onclick = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      createNewFolder(currentPath, folderName);
    }
  };
  controls.appendChild(createBtn);

  const upBtn = document.createElement("button");
  upBtn.textContent = "Go Up";
  if (currentPath === "/") {
    upBtn.disabled = true;
  } else {
    upBtn.onclick = () => {
      const parts = currentPath.split("/");
      parts.pop();
      const parent = parts.join("/") || "/";
      document.getElementById(currentFieldId).value = parent;
      openBrowser(currentFieldId);
    };
  }
  controls.appendChild(upBtn);

  container.appendChild(controls);
}

function openBrowserWithPath(path) {
  document.getElementById(currentFieldId).value = path;
  openBrowser(currentFieldId);
}

function closeBrowserModal() {
  document.getElementById("browserModal").style.display = "none";
}

function createNewFolder(basePath, folderName) {
  fetch('/create_folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base: basePath, name: folderName })
  }).then(() => {
    openBrowser(currentFieldId);
  }).catch(err => {
    alert("Error creating folder: " + err);
  });
}
