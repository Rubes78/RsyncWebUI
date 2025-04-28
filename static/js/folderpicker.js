
let currentBrowsePath = "/";
let currentFieldId = "";

function openBrowser(fieldId) {
  currentFieldId = fieldId;
  currentBrowsePath = document.getElementById(fieldId).value || "/";
  loadBrowser(currentBrowsePath);
}

function loadBrowser(path) {
  fetch("/browse?path=" + encodeURIComponent(path))
    .then(res => res.json())
    .then(data => {
      currentBrowsePath = data.current;
      const content = document.getElementById("browserContent");
      content.innerHTML = "";

      content.appendChild(createButtonRow());

      const header = document.createElement("h3");
      header.textContent = data.current;
      content.appendChild(header);

      if (data.current !== "/") {
        const upDiv = document.createElement("div");
        const parentPath = data.current.replace(/\/$/, '').split("/").slice(0, -1).join("/") || "/";
        upDiv.innerHTML = "<a href='#' onclick=\"loadBrowser('" + parentPath + "')\">⬆ Go Up</a>";
        content.appendChild(upDiv);
      }

      data.contents.forEach(item => {
        if (item.is_dir) {
          const div = document.createElement("div");
          const cleanPath = data.current.replace(/\/+$/, '') + '/' + item.name;
          div.innerHTML = "<a href='#' onclick=\"loadBrowser('" + cleanPath + "')\">📁 " + item.name + "</a>";
          content.appendChild(div);
        }
      });

      content.appendChild(createButtonRow());

      document.getElementById("browserModal").style.display = "block";
    });
}

function createButtonRow() {
  const buttonRow = document.createElement("div");
  buttonRow.style.marginTop = "10px";
  buttonRow.style.marginBottom = "10px";

  const selectBtn = document.createElement("button");
  selectBtn.textContent = "Use This Folder";
  selectBtn.onclick = () => {
    document.getElementById(currentFieldId).value = currentBrowsePath;
    closeBrowserModal();
  };
  buttonRow.appendChild(selectBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.marginLeft = "10px";
  cancelBtn.onclick = () => closeBrowserModal();
  buttonRow.appendChild(cancelBtn);

  const createBtn = document.createElement("button");
  createBtn.textContent = "Create Folder";
  createBtn.style.marginLeft = "10px";
  createBtn.onclick = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      fetch("/create_folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentBrowsePath, name: folderName })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const newPath = currentBrowsePath.replace(/\/+$/, '') + '/' + folderName;
          document.getElementById(currentFieldId).value = newPath;
          closeBrowserModal();
        } else {
          alert("Failed to create folder: " + result.error);
        }
      });
    }
  };
  buttonRow.appendChild(createBtn);

  return buttonRow;
}

function closeBrowserModal() {
  document.getElementById("browserModal").style.display = "none";
}
