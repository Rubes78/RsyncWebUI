
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
      content.innerHTML = "<h3>" + data.current + "</h3>";

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

      const buttonRow = document.createElement("div");
      buttonRow.style.marginTop = "20px";

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

      content.appendChild(buttonRow);
      document.getElementById("browserModal").style.display = "block";
    });
}

function closeBrowserModal() {
  document.getElementById("browserModal").style.display = "none";
}
