
function openBrowser(fieldId) {
  const path = document.getElementById(fieldId).value || "/";
  fetch("/browse?path=" + encodeURIComponent(path))
    .then(res => res.json())
    .then(data => {
      const content = document.getElementById("browserContent");
      content.innerHTML = "<h3>" + data.current + "</h3>";
      data.contents.forEach(item => {
        const div = document.createElement("div");
        if (item.is_dir) {
          div.innerHTML = "<a href='#' onclick=\"openBrowserWithPath('" + data.current + "/" + item.name + "', '" + fieldId + "')\">📁 " + item.name + "</a>";
        } else {
          div.textContent = "📄 " + item.name;
        }
        content.appendChild(div);
      });
      const selectBtn = document.createElement("button");
      selectBtn.textContent = "Use This Folder";
      selectBtn.onclick = () => {
        document.getElementById(fieldId).value = data.current;
        closeBrowserModal();
      };
      content.appendChild(selectBtn);
      document.getElementById("browserModal").style.display = "block";
    });
}

function openBrowserWithPath(path, fieldId) {
  document.getElementById(fieldId).value = path;
  openBrowser(fieldId);
}

function closeBrowserModal() {
  document.getElementById("browserModal").style.display = "none";
}
