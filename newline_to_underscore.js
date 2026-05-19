const input = document.getElementById("inputText");
const output = document.getElementById("outputText");
const target = document.getElementById("target");
const repl = document.getElementById("replacement");
const convertBtn = document.getElementById("convertBtn");
const convertAllBtn = document.getElementById("convertAllBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadRtfBtn = document.getElementById("downloadRtfBtn");
const clearBtn = document.getElementById("clearBtn");
const pasteBtn = document.getElementById("pasteBtn");
const swapBtn = document.getElementById("swapBtn");
const colorBar = document.getElementById("colorBar");
const colorInput = document.getElementById("colorInput");
const colorPicker = document.getElementById("colorPicker");

let currentColor = colorInput.value;
let outputValue = "";
let outputHtml = "";
let lastReplacement = repl.value ?? "_";
const colorProbe = document.createElement("span");
colorProbe.style.position = "absolute";
colorProbe.style.left = "-9999px";
document.body.appendChild(colorProbe);

// dropdown
const dropdown = document.getElementById("optionsDropdown");
const btn = dropdown.querySelector(".dropdown-btn");
const items = dropdown.querySelectorAll(".dropdown-item");
btn.addEventListener("click", () => dropdown.classList.toggle("open"));
items.forEach((item) => {
  const checkbox = item.querySelector("input");
  item.addEventListener("click", () => {
    checkbox.checked = !checkbox.checked;
    item.classList.toggle("selected", checkbox.checked);
  });
});
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
});

function selected(v) {
  return [...items].some(
    (i) =>
      i.querySelector("input").checked && i.querySelector("input").value === v,
  );
}

function replaceCustom(text, targetVal, replacement) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (selected("trim")) {
    text = text
      .split("\n")
      .map((s) => s.trim())
      .join("\n");
  }
  if (selected("squash")) {
    text = text.replace(/\n{2,}/g, "\n");
  }
  // الگوی جستجو
  let searchPattern;
  if (targetVal === "\\n") {
    // اگر کاربر \n نوشت
    searchPattern = /\n/g;
  } else if (targetVal === " ") {
    // اگر اسپیس باشه
    searchPattern = / /g;
  } else {
    const esc = targetVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    searchPattern = new RegExp(esc, "g");
  }
  return text.replace(searchPattern, replacement);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRtf(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\r\n|\r|\n/g, "\\par\n");
}

function colorToRgb(value) {
  colorProbe.style.color = value;
  const computed = getComputedStyle(colorProbe).color;
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    return { r: 0, g: 0, b: 0 };
  }
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function buildColoredHtml(result, replacement, color) {
  if (!result) {
    return "";
  }
  if (!replacement) {
    return escapeHtml(result);
  }
  const safe = escapeHtml(result);
  const safeReplacement = escapeHtml(replacement);
  const esc = safeReplacement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc, "g");
  return safe.replace(
    re,
    `<span class="replacement-color" style="color:${color}">$&</span>`,
  );
}

function buildColoredRtf(result, replacement, color) {
  if (!result) {
    return "";
  }
  const rgb = colorToRgb(color);
  const header = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Segoe UI;}}{\\colortbl ;\\red0\\green0\\blue0;\\red${rgb.r}\\green${rgb.g}\\blue${rgb.b};}\\f0\\fs22\\cf1 `;
  let body = "";
  if (!replacement) {
    body = escapeRtf(result);
  } else {
    const parts = result.split(replacement);
    const repl = escapeRtf(replacement);
    body = parts.map(escapeRtf).join(`\\cf2 ${repl}\\cf1 `);
  }
  return `${header}${body}}`;
}

function renderOutput(result, replacement, color) {
  if (!result) {
    output.textContent = "خروجی بعد از تبدیل نمایش داده می‌شود.";
    output.classList.add("is-empty");
    outputHtml = "";
    return;
  }
  output.classList.remove("is-empty");
  if (!replacement) {
    output.textContent = result;
    outputHtml = escapeHtml(result);
    return;
  }
  outputHtml = buildColoredHtml(result, replacement, color);
  output.innerHTML = outputHtml;
}

function isValidColor(value) {
  return CSS.supports("color", value);
}

function setActiveSwatch(color) {
  const swatches = [...colorBar.querySelectorAll(".color-swatch")];
  swatches.forEach((s) => {
    const isActive = s.dataset.color === color;
    s.classList.toggle("active", isActive);
  });
}

function updateOutputView() {
  renderOutput(outputValue, lastReplacement, currentColor);
}

// رنگ‌ها
colorBar.addEventListener("click", (e) => {
  const swatch = e.target.closest(".color-swatch");
  if (!swatch) return;
  const color = swatch.dataset.color;
  currentColor = color;
  colorInput.value = color;
  colorPicker.value = rgbToHex(colorToRgb(color));
  colorInput.classList.remove("invalid");
  setActiveSwatch(color);
  updateOutputView();
});

colorInput.addEventListener("input", () => {
  const value = colorInput.value.trim();
  if (isValidColor(value)) {
    currentColor = value;
    colorInput.classList.remove("invalid");
    setActiveSwatch(value);
    colorPicker.value = rgbToHex(colorToRgb(value));
    updateOutputView();
  } else {
    colorInput.classList.add("invalid");
  }
});

colorPicker.addEventListener("input", () => {
  const rgb = colorToRgb(colorPicker.value);
  const asRgb = rgbString(rgb);
  currentColor = asRgb;
  colorInput.value = asRgb;
  colorInput.classList.remove("invalid");
  setActiveSwatch(asRgb);
  updateOutputView();
});

convertBtn.addEventListener("click", () => {
  const t = target.value || "\\n";
  lastReplacement = repl.value ?? "_";
  outputValue = replaceCustom(input.value, t, lastReplacement);
  renderOutput(outputValue, lastReplacement, currentColor);
});

copyBtn.addEventListener("click", async () => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const html = outputValue
        ? `<div style="white-space:pre-wrap;">${outputHtml}</div>`
        : "";
      const rtf = outputValue
        ? buildColoredRtf(outputValue, lastReplacement, currentColor)
        : "";
      const data = {
        "text/plain": new Blob([outputValue], { type: "text/plain" }),
      };
      if (html) {
        data["text/html"] = new Blob([html], { type: "text/html" });
      }
      if (rtf) {
        data["text/rtf"] = new Blob([rtf], { type: "text/rtf" });
      }
      const item = new ClipboardItem(data);
      await navigator.clipboard.write([item]);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(outputValue);
    } else {
      const range = document.createRange();
      range.selectNodeContents(output);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
    }
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "کپی"), 1200);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(output);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([outputValue], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

downloadRtfBtn.addEventListener("click", () => {
  if (!outputValue) {
    return;
  }
  const rtf = buildColoredRtf(outputValue, lastReplacement, currentColor);
  const blob = new Blob([rtf], { type: "application/rtf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted.rtf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  outputValue = "";
  updateOutputView();
});

pasteBtn.addEventListener("click", async () => {
  try {
    input.value = await navigator.clipboard.readText();
  } catch {
    alert("کلیپ‌بورد قابل دسترسی نیست.");
  }
});

swapBtn.addEventListener("click", () => {
  const t = input.value;
  input.value = outputValue;
  outputValue = t;
  updateOutputView();
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault();
    convertBtn.click();
  }
});

// رنگ‌های اولیه
[...colorBar.querySelectorAll(".color-swatch")].forEach((s) => {
  s.style.setProperty("--swatch", s.dataset.color);
});

colorPicker.value = rgbToHex(colorToRgb(currentColor));
updateOutputView();
