// Utilidad: obtener la hora actual en formato HH:MM
function getCurrentTimeHM() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Calcular edad a partir de fecha de nacimiento
function calculateAgeFromBirthdate(dateString) {
  if (!dateString) return "";
  const today = new Date();
  const birthDate = new Date(dateString + "T00:00:00");
  if (isNaN(birthDate.getTime())) return "";
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : "";
}

// Sanitizar texto para usarlo en el nombre del archivo
function sanitizeForFileName(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-zA-Z0-9]+/g, "_")    // espacios/símbolos -> _
    .replace(/^_+|_+$/g, "")           // quitar _ al inicio/fin
    .toLowerCase();
}



function syncFormValuesToClone(sourceRoot, cloneRoot) {
  const sourceEls = Array.from(sourceRoot.querySelectorAll("input, select, textarea"));
  const cloneEls = Array.from(cloneRoot.querySelectorAll("input, select, textarea"));
  sourceEls.forEach((src, idx) => {
    const dst = cloneEls[idx];
    if (!dst) return;

    if (src instanceof HTMLInputElement) {
      if (src.type === "checkbox" || src.type === "radio") {
        dst.checked = src.checked;
        if (src.checked) dst.setAttribute("checked", "checked");
        else dst.removeAttribute("checked");
      } else {
        dst.value = src.value;
        dst.setAttribute("value", src.value || "");
      }
    } else if (src instanceof HTMLTextAreaElement) {
      dst.value = src.value;
      dst.textContent = src.value || "";
    } else if (src instanceof HTMLSelectElement) {
      Array.from(dst.options).forEach((opt, i) => {
        opt.selected = src.selectedIndex === i;
        if (opt.selected) opt.setAttribute("selected", "selected");
        else opt.removeAttribute("selected");
      });
      dst.value = src.value;
    }
  });
}

function hideUncheckedOptions(root) {
  root.querySelectorAll(".checkbox-group .checkbox-item").forEach((label) => {
    const input = label.querySelector('input[type="checkbox"], input[type="radio"]');
    if (input && !input.checked) label.classList.add("export-hide");
  });

  root.querySelectorAll("#plan-egreso-section .field").forEach((field) => {
    const control = field.querySelector("textarea, input, select");
    if (!control) return;
    const value = (control.value || "").trim();
    if (!value) field.classList.add("export-hide");
  });
}

function cloneExportWrapper() {
  const source = document.getElementById("hoja-enfermeria");
  if (!source) return null;
  const clone = source.cloneNode(true);
  syncFormValuesToClone(source, clone);

  clone.querySelectorAll("script").forEach((el) => el.remove());
  clone.querySelectorAll(".icon-btn, #btn-add-sv, #btn-add-ft, #btn-download-pdf, #btn-download-word").forEach((el) => el.remove());
  clone.querySelectorAll(".table-wrapper").forEach((el) => { el.style.overflow = "visible"; });
  clone.querySelectorAll("img").forEach((img) => {
    try {
      img.src = new URL(img.getAttribute("src") || "", document.baseURI).href;
    } catch (err) {}
  });
  hideUncheckedOptions(clone);
  return clone;
}

function transformCloneForWord(root) {
  if (!root) return;

  root.querySelectorAll(".header-logo").forEach((img) => img.remove());
  const planEgresoSection = root.querySelector("#plan-egreso-section");
  if (planEgresoSection) planEgresoSection.classList.add("page-break-before-egreso");
  root.querySelectorAll(".action-buttons, .btn, .icon-btn").forEach((el) => el.remove());

  root.querySelectorAll(".scale-card-collapsible").forEach((card) => {
    card.classList.remove("is-collapsed");
    const body = card.querySelector(".scale-card-body");
    if (body) {
      body.style.display = "block";
      body.style.maxHeight = "none";
      body.style.overflow = "visible";
    }
  });

  const notesPanel = root.querySelector("#downton-notes-panel");
  const notesField = root.querySelector("#downton-notas");
  if (notesPanel) {
    const hasNotes = !!(notesField && (notesField.value || notesField.textContent || "").trim());
    notesPanel.classList.toggle("is-hidden", !hasNotes);
  }

  // REEMPLAZAR INPUTS/SELECTS/TEXTAREAS POR DIVS DE TEXTO
  root.querySelectorAll("input, select, textarea").forEach((el) => {
    if (el.type === "hidden") {
      el.remove();
      return;
    }

    let value = "";
    if (el instanceof HTMLSelectElement) {
      value = el.options[el.selectedIndex]?.text || "";
    } else if (el instanceof HTMLTextAreaElement) {
      value = el.value || el.textContent || "";
    } else if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        // Eliminar el input siempre; el label que lo envuelve ya contiene el texto visible.
        // hideUncheckedOptions() ya ocultó los items no seleccionados antes de llegar aquí.
        el.remove();
        return;
      } else {
        value = el.value || "";
      }
    }

    const replacement = document.createElement("div");
    replacement.className = "word-field-value";
    replacement.textContent = (value || "").trim() || "—";

    if (el.closest("td")) {
      replacement.classList.add("word-table-value");
    }
    if (el.tagName === "TEXTAREA") {
      replacement.classList.add("word-textarea-value");
    }
    el.replaceWith(replacement);
  });

  root.querySelectorAll(".selected-preview").forEach((el) => { el.remove(); });

  root.querySelectorAll(".dd-multi-menu, .downton-hidden-inputs").forEach((el) => el.remove());
  root.querySelectorAll(".dd-multi-btn").forEach((btn) => {
    const replacement = document.createElement("div");
    replacement.className = "word-field-value";
    replacement.textContent = (btn.textContent || "").trim() || "Ninguno (0)";
    btn.replaceWith(replacement);
  });

  // TRANSFORMAR GRIDS EN TABLAS (WORD COMPATIBILITY)
  const transformToTable = (selector, columns) => {
    root.querySelectorAll(selector).forEach((grid) => {
      const children = Array.from(grid.children);
      if (children.length === 0) return;

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.marginBottom = "4px";

      let currentRow;
      children.forEach((child, idx) => {
        if (idx % columns === 0) {
          currentRow = document.createElement("tr");
          table.appendChild(currentRow);
        }
        const td = document.createElement("td");
        td.style.verticalAlign = "top";
        td.style.padding = "2px 4px";
        td.style.width = `${100 / columns}%`;
        td.appendChild(child);
        currentRow.appendChild(td);
      });
      grid.replaceWith(table);
    });
  };

  transformToTable(".section-grid-2", 2);
  transformToTable(".section-grid-2-tall", 2);
  transformToTable(".field-row", 2);
}

function buildWordExportHtml(wrapperClone) {
  transformCloneForWord(wrapperClone);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Hoja de enfermería</title>
<style>
@page { size: A4; margin: 5mm; }
body { background: #ffffff !important; padding: 0 !important; color: #111827; font-family: Arial, sans-serif !important; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif !important; }
.app-wrapper { box-shadow: none !important; margin: 0 auto !important; max-width: 100% !important; border: 1px solid #d1d5db !important; padding: 4px 6px 6px !important; border-radius: 6px !important; }
.header { margin-bottom: 2px !important; padding-bottom: 2px !important; text-align: center !important; border-bottom: 1px solid #eee !important; }
.header-logo { display:none !important; }
.header-title { font-size: 11px !important; letter-spacing: .05em !important; margin: 0 !important; font-weight: bold; }
.header-subtitle { font-size: 8px !important; letter-spacing: .05em !important; margin: 0 !important; }
.section { margin-top: 3px !important; padding: 3px 5px 4px !important; background: #ffffff !important; border: 1px solid #eee !important; border-radius: 4px !important; }
.section-title { margin-bottom: 2px !important; font-size: 9px !important; font-weight: bold !important; color: #444 !important; }
.field { gap: 0 !important; font-size: 8.5px !important; margin-bottom: 2px !important; }
label { display:block; margin-bottom: 0px; font-size: 8.5px !important; font-weight: bold !important; color: #333 !important; }
.word-field-value { min-height: 14px; border: 1px solid #ccc; border-radius: 3px; padding: 2px 4px; background: #ffffff; font-size: 8.5px; line-height: 1.1; white-space: pre-wrap; word-break: break-word; }
.word-textarea-value { min-height: 24px; }
.word-table-value { min-height: 12px; padding: 1px 3px; border-radius: 2px; }
.table-wrapper { overflow: visible !important; border-radius: 4px !important; margin-top: 2px !important; }
table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed; }
th, td { padding: 2px 3px !important; border: 1px solid #ddd !important; white-space: normal !important; word-break: break-word; font-size: 8px !important; line-height: 1.05 !important; }
thead { background: #f0f0f0 !important; }
tr { page-break-inside: avoid; }
.action-buttons, .btn, .icon-btn, .footer-note + .btn, .footer-note + .action-buttons, .downton-notes-toggle-wrap, .scale-card-chevron, .tag, .help, .multi-sheet-shell { display:none !important; }
.checkbox-group .checkbox-item.export-hide,
#plan-egreso-section .field.export-hide,
.downton-hidden-inputs,
.dd-multi-menu,
.export-hide { display:none !important; }
.checkbox-group { gap: 1px !important; }
.checkbox-item { gap: 3px !important; font-size: 8px !important; margin-bottom: 1px !important; }
.downton-group-title { font-size: 7.5px !important; min-height: 0 !important; margin-bottom: 1px !important; font-weight: bold; }
.downton-total { padding: 3px !important; margin-bottom: 1px; font-size: 8px !important; background: #f9f9f9 !important; border: 1px solid #eee !important; }
.footer-note { font-size: 7.5px !important; margin-top: 4px !important; color: #999 !important; }
.page-break-before-egreso { break-before: page; page-break-before: always; }
#hoja-enfermeria { max-width: 100% !important; }
</style>
</head>
<body>${wrapperClone.outerHTML}</body>
</html>`;
}


function addSignoVitalRow(tableBody) {
  const row = document.createElement("tr");

  const horaCell = document.createElement("td");
  const horaInput = document.createElement("input");
  horaInput.type = "time";
  horaInput.value = getCurrentTimeHM();
  horaCell.appendChild(horaInput);

  const taCell = document.createElement("td");
  const taInput = document.createElement("input");
  taInput.type = "text";
  taInput.placeholder = "120/80";
  taCell.appendChild(taInput);

  const fcCell = document.createElement("td");
  const fcInput = document.createElement("input");
  fcInput.type = "number";
  fcInput.min = "0";
  fcInput.placeholder = "70";
  fcCell.appendChild(fcInput);

  const frCell = document.createElement("td");
  const frInput = document.createElement("input");
  frInput.type = "number";
  frInput.min = "0";
  frInput.placeholder = "18";
  frCell.appendChild(frInput);

  const tempCell = document.createElement("td");
  const tempInput = document.createElement("input");
  tempInput.type = "number";
  tempInput.step = "0.1";
  tempInput.placeholder = "36.5";
  tempCell.appendChild(tempInput);

  const spo2Cell = document.createElement("td");
  spo2Cell.className = "cell-with-x";
  const spo2Input = document.createElement("input");
  spo2Input.type = "number";
  spo2Input.min = "0";
  spo2Input.max = "100";
  spo2Input.placeholder = "98";
  spo2Cell.appendChild(spo2Input);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "icon-btn";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", () => {
    tableBody.removeChild(row);
  });
  spo2Cell.appendChild(delBtn);

  row.appendChild(horaCell);
  row.appendChild(taCell);
  row.appendChild(fcCell);
  row.appendChild(frCell);
  row.appendChild(tempCell);
  row.appendChild(spo2Cell);

  tableBody.appendChild(row);
}




function getSelectText(selectEl) {
  if (!(selectEl instanceof HTMLSelectElement)) return "";
  return selectEl.options[selectEl.selectedIndex]?.text || "";
}

function serializeTableRows(tableSelector) {
  const table = document.querySelector(tableSelector);
  if (!table) return [];
  return Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => {
      const control = td.querySelector("input, select, textarea");
      if (!control) return "";
      if (control instanceof HTMLSelectElement) return control.value || "";
      if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
        return control.checked ? "1" : "0";
      }
      return control.value || "";
    })
  );
}

function serializeCurrentSheet() {
  const data = { fields: {}, signosVitales: serializeTableRows("#tabla-signos-vitales"), farmacoterapia: serializeTableRows("#tabla-farmacoterapia") };
  document.querySelectorAll("#hoja-enfermeria input, #hoja-enfermeria select, #hoja-enfermeria textarea").forEach((el) => {
    const key = el.name || el.id;
    if (!key) return;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      data.fields[key] = !!el.checked;
    } else {
      data.fields[key] = el.value || "";
    }
  });
  return data;
}

function ensureTableRowCount(tableSelector, desiredCount, rowFactory) {
  const tbody = document.querySelector(`${tableSelector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";
  for (let i = 0; i < desiredCount; i++) {
    rowFactory(tbody);
  }
}

function applyTableRows(tableSelector, rowsData, rowFactory) {
  const rows = Array.isArray(rowsData) && rowsData.length ? rowsData : [[]];
  ensureTableRowCount(tableSelector, rows.length, rowFactory);
  const renderedRows = Array.from(document.querySelectorAll(`${tableSelector} tbody tr`));
  renderedRows.forEach((tr, rowIndex) => {
    const rowValues = rows[rowIndex] || [];
    Array.from(tr.querySelectorAll("td")).forEach((td, cellIndex) => {
      const control = td.querySelector("input, select, textarea");
      if (!control) return;
      const value = rowValues[cellIndex] ?? "";
      if (control instanceof HTMLSelectElement) {
        control.value = value;
      } else if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
        control.checked = value === "1";
      } else {
        control.value = value;
      }
    });
  });
}

function refreshSelectedPreviews(root = document) {
  const previews = root.querySelectorAll('.selected-preview[data-for]');
  previews.forEach((div) => {
    const id = div.getAttribute('data-for');
    const sel = document.getElementById(id);
    if (!sel) return;
    const txt = getSelectText(sel);
    sel.title = txt || '';
    div.textContent = txt || '';
    div.style.display = sel.value ? 'block' : 'none';
  });
}

function updateSheetTabLabels(store, container) {
  if (!container) return;
  container.innerHTML = "";
  store.forEach((sheet, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sheet-tab${sheet.active ? " is-active" : ""}`;
    const patientName = (sheet.data?.fields?.nombre || "").trim();
    btn.textContent = patientName ? `Hoja ${idx + 1}: ${patientName}` : `Hoja ${idx + 1}`;
    btn.dataset.sheetId = sheet.id;
    container.appendChild(btn);
  });
}

function addMedicamentoRow(tableBody, medicamentosDatalistId) {
  const row = document.createElement("tr");

  const horaCell = document.createElement("td");
  const horaInput = document.createElement("input");
  horaInput.type = "time";
  horaInput.value = getCurrentTimeHM();
  horaCell.appendChild(horaInput);

  const medCell = document.createElement("td");
  const medInput = document.createElement("input");
  medInput.type = "text";
  medInput.setAttribute("list", medicamentosDatalistId);
  medInput.placeholder = "Buscar medicamento…";
  medCell.appendChild(medInput);

  const dosisCell = document.createElement("td");
  const dosisInput = document.createElement("input");
  dosisInput.type = "text";
  dosisInput.placeholder = "Ej. 500 mg";
  dosisCell.appendChild(dosisInput);

  const dilCell = document.createElement("td");
  const dilInput = document.createElement("input");
  dilInput.type = "text";
  dilInput.placeholder = "Opcional";
  dilCell.appendChild(dilInput);

  const tiempoCell = document.createElement("td");
  const tiempoInput = document.createElement("input");
  tiempoInput.type = "text";
  tiempoInput.placeholder = "Ej. 30 min";
  tiempoCell.appendChild(tiempoInput);

  const viaCell = document.createElement("td");
  const viaSelect = document.createElement("select");
  ["", "IV", "VO", "IM", "SC", "Otro"].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt === "" ? "Seleccionar…" : opt;
    viaSelect.appendChild(o);
  });
  viaCell.appendChild(viaSelect);

  // Tipo de catéter (solo aplica para vía IV)
  const cateterCell = document.createElement("td");
  cateterCell.className = "cell-with-x";
  const cateterSelect = document.createElement("select");
  [
    { value: "", label: "Seleccionar…" },
    { value: "CVP_24G", label: "CVP (catéter venoso periférico corto) - 24G" },
    { value: "CVP_22G", label: "CVP (catéter venoso periférico corto) - 22G" },
    { value: "CVP_20G", label: "CVP (catéter venoso periférico corto) - 20G" },
    { value: "CVC", label: "CVC (Catéter Venoso Central)" },
    { value: "PICC", label: "PICC (catéter central de inserción periférica)" },
    { value: "PUERTO", label: "Puerto implantable" }
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    cateterSelect.appendChild(o);
  });
  cateterSelect.disabled = true;

    // Tipo de catéter: desplegable (sin bloqueo por vía)
  cateterSelect.disabled = false;

  cateterCell.appendChild(cateterSelect);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "icon-btn";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", () => {
    tableBody.removeChild(row);
  });
  cateterCell.appendChild(delBtn);

  row.appendChild(horaCell);
  row.appendChild(medCell);
  row.appendChild(dosisCell);
  row.appendChild(dilCell);
  row.appendChild(tiempoCell);
  row.appendChild(viaCell);
  row.appendChild(cateterCell);

  tableBody.appendChild(row);
}

document.addEventListener("DOMContentLoaded", () => {
  // Fecha del día en automático
  const fechaInput = document.getElementById("fecha");
  if (fechaInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    fechaInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Calcular edad desde fecha de nacimiento
  const nacimientoInput = document.getElementById("fecha-nacimiento");
  const edadInput = document.getElementById("edad");
  if (nacimientoInput && edadInput) {
    nacimientoInput.addEventListener("change", () => {
      const age = calculateAgeFromBirthdate(nacimientoInput.value);
      edadInput.value = age ? `${age} años` : "";
    });
  }

  // Prellenar hora de entrada con hora actual
  const horaEntradaInput = document.getElementById("hora-entrada");
  if (horaEntradaInput) {
    horaEntradaInput.value = getCurrentTimeHM();
  }

  // Signos vitales tabla dinámica
  const svTbody = document.querySelector("#tabla-signos-vitales tbody");
  const addSvButton = document.getElementById("btn-add-sv");
  if (svTbody && addSvButton) {
    // Crear filas iniciales
    for (let i = 0; i < 1; i++) {
      addSignoVitalRow(svTbody);
    }
    addSvButton.addEventListener("click", () => addSignoVitalRow(svTbody));
  }

  // Farmacoterapia tabla dinámica
  const ftTbody = document.querySelector("#tabla-farmacoterapia tbody");
  const addFtButton = document.getElementById("btn-add-ft");
  if (ftTbody && addFtButton) {
    // Crear algunas filas iniciales
    for (let i = 0; i < 1; i++) {
      addMedicamentoRow(ftTbody, "lista-medicamentos");
    }
    addFtButton.addEventListener("click", () => addMedicamentoRow(ftTbody, "lista-medicamentos"));
  }

  // Cargar medicamentos desde JSON para autocompletar
  const medicamentosDataList = document.getElementById("lista-medicamentos");
  if (medicamentosDataList) {
    fetch("assets/data/medicamentos.json")
      .then((res) => res.json())
      .then((data) => {
        data.forEach((med) => {
          const opt = document.createElement("option");
          opt.value = med;
          medicamentosDataList.appendChild(opt);
        });
      })
      .catch((err) => {
        console.error("Error cargando medicamentos:", err);
      });
  }


  initSelectedPreviews();

  const sheetTabsContainer = document.getElementById("sheet-tabs");
  const btnNewSheet = document.getElementById("btn-new-sheet");
  const btnDuplicateSheet = document.getElementById("btn-duplicate-sheet");
  const btnDeleteSheet = document.getElementById("btn-delete-sheet");
  const sheetStore = [{ id: `sheet-${Date.now()}`, active: true, data: serializeCurrentSheet() }];

  const getActiveSheetIndex = () => sheetStore.findIndex((sheet) => sheet.active);

  let isLoadingSheet = false;

  const saveActiveSheet = () => {
    if (isLoadingSheet) return;
    const idx = getActiveSheetIndex();
    if (idx < 0) return;
    sheetStore[idx].data = serializeCurrentSheet();
  };

  const loadSheet = (sheetId) => {
    // Guardar la hoja ACTUALMENTE activa (antes de cambiar el active)
    if (!isLoadingSheet) {
      const prevIdx = getActiveSheetIndex();
      if (prevIdx >= 0) {
        sheetStore[prevIdx].data = serializeCurrentSheet();
      }
    }
    const target = sheetStore.find((sheet) => sheet.id === sheetId);
    if (!target) return;
    isLoadingSheet = true;
    sheetStore.forEach((sheet) => { sheet.active = sheet.id === sheetId; });

    const data = target.data || { fields: {}, signosVitales: [[]], farmacoterapia: [[]] };
    document.querySelectorAll("#hoja-enfermeria input, #hoja-enfermeria select, #hoja-enfermeria textarea").forEach((el) => {
      const key = el.name || el.id;
      if (!key) return;
      const value = data.fields?.[key];
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        el.checked = !!value;
      } else {
        el.value = value ?? "";
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    applyTableRows("#tabla-signos-vitales", data.signosVitales, addSignoVitalRow);
    applyTableRows("#tabla-farmacoterapia", data.farmacoterapia, (tbody) => addMedicamentoRow(tbody, "lista-medicamentos"));
    refreshSelectedPreviews();
    isLoadingSheet = false;
    updateSheetTabLabels(sheetStore, sheetTabsContainer);
  };

  if (sheetTabsContainer) {
    updateSheetTabLabels(sheetStore, sheetTabsContainer);
    sheetTabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".sheet-tab");
      if (!btn) return;
      loadSheet(btn.dataset.sheetId);
    });
  }

  if (btnNewSheet) {
    btnNewSheet.addEventListener("click", () => {
      const newSheet = {
        id: `sheet-${Date.now()}-${sheetStore.length + 1}`,
        active: false,
        data: { fields: {}, signosVitales: [[]], farmacoterapia: [[]] }
      };
      sheetStore.push(newSheet);
      loadSheet(newSheet.id);
    });
  }

  if (btnDuplicateSheet) {
    btnDuplicateSheet.addEventListener("click", () => {
      const idx = getActiveSheetIndex();
      const current = idx >= 0 ? sheetStore[idx] : null;
      if (!current) return;
      // Guardar estado actual del DOM en la hoja activa antes de duplicar
      current.data = serializeCurrentSheet();
      const copy = JSON.parse(JSON.stringify(current.data));
      const newSheet = { id: `sheet-${Date.now()}-${sheetStore.length + 1}`, active: false, data: copy };
      sheetStore.push(newSheet);
      loadSheet(newSheet.id);
    });
  }

  if (btnDeleteSheet) {
    btnDeleteSheet.addEventListener("click", () => {
      if (sheetStore.length === 1) {
        alert("Debe existir al menos una hoja de enfermería activa.");
        return;
      }
      const idx = getActiveSheetIndex();
      if (idx < 0) return;
      sheetStore.splice(idx, 1);
      const nextIdx = Math.max(0, idx - 1);
      sheetStore.forEach((sheet, sIdx) => { sheet.active = sIdx === nextIdx; });
      loadSheet(sheetStore[nextIdx].id);
    });
  }

  document.getElementById("hoja-enfermeria")?.addEventListener("input", () => {
    saveActiveSheet();
    updateSheetTabLabels(sheetStore, sheetTabsContainer);
  });

  document.getElementById("hoja-enfermeria")?.addEventListener("change", () => {
    saveActiveSheet();
    updateSheetTabLabels(sheetStore, sheetTabsContainer);
  });

  // Desplegable para la escala "Riesgo de caídas (J.H. Downton)"
  const downtonCard = document.getElementById("downton-card");
  if (downtonCard) {
    const downtonHeader = downtonCard.querySelector(".scale-card-header");
    const downtonBody = downtonCard.querySelector(".scale-card-body");

    const setExpanded = (expanded) => {
      downtonCard.classList.toggle("is-collapsed", !expanded);
      if (downtonHeader) downtonHeader.setAttribute("aria-expanded", String(expanded));
      if (downtonBody) {
        downtonBody.style.maxHeight = expanded ? downtonBody.scrollHeight + "px" : "0px";
      }
    };

    const toggle = () => {
      const isCollapsed = downtonCard.classList.contains("is-collapsed");
      setExpanded(isCollapsed);
    };

    if (downtonHeader && downtonBody) {
      downtonHeader.addEventListener("click", toggle);
      downtonHeader.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      window.addEventListener("resize", () => {
        if (!downtonCard.classList.contains("is-collapsed")) {
          downtonBody.style.maxHeight = downtonBody.scrollHeight + "px";
        }
      });

      // Iniciar desplegado
      setExpanded(true);
    }
  }

  // Escala de riesgo de caídas (J.H. Downton): calcular puntaje
  const downtonTotal = document.getElementById("downton-total");
  if (downtonTotal) {
    const updateDowntonTotal = () => {
      let sum = 0;
      document.querySelectorAll(".downton-item").forEach((el) => {
        if (el.checked) {
          sum += Number(el.getAttribute("data-score") || 0);
        }
      });
      downtonTotal.value = String(sum);
    };

    const syncNoneOptionForGroup = (groupKey) => {
      const noneEl = document.querySelector(`.downton-none[data-group='${groupKey}']`);
      const optEls = Array.from(document.querySelectorAll(`.downton-opt[data-group='${groupKey}']`));
      if (!noneEl) return;

      const ensureNoneIfEmpty = () => {
        const anyChecked = optEls.some((o) => o.checked);
        if (!anyChecked) noneEl.checked = true;
      };

      noneEl.addEventListener("change", () => {
        if (noneEl.checked) {
          optEls.forEach((o) => (o.checked = false));
        } else {
          // Evitar estado sin selección: si no hay opciones activas, mantener "Ninguno".
          ensureNoneIfEmpty();
        }
        updateDowntonTotal();
      });

      optEls.forEach((o) => {
        o.addEventListener("change", () => {
          if (o.checked) noneEl.checked = false;
          ensureNoneIfEmpty();
          updateDowntonTotal();
        });
      });
    };

    syncNoneOptionForGroup("meds");
    syncNoneOptionForGroup("sens");

    document.querySelectorAll(".downton-item").forEach((el) => {
      el.addEventListener("change", updateDowntonTotal);
    });

    // --- UI desplegable para Downton (selects y multiselección) ---
    const initDowntonDropdowns = () => {
      // Sincronizar selects (radio -> select y select -> radio)
      document.querySelectorAll("select.downton-select[data-sync-name]").forEach((sel) => {
        const name = sel.getAttribute("data-sync-name");
        if (!name) return;

        const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`));
        const syncSelectFromRadios = () => {
          const checked = radios.find((r) => r.checked);
          if (checked) sel.value = checked.getAttribute("data-score") || sel.value;
        };

        sel.addEventListener("change", () => {
          const val = sel.value;
          const target = radios.find((r) => (r.getAttribute("data-score") || "") === val);
          if (target) {
            target.checked = true;
            target.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });

        radios.forEach((r) => r.addEventListener("change", syncSelectFromRadios));
        syncSelectFromRadios();
      });

      // Crear dropdown multiselección (checkboxes)
      const closeAllMulti = () => {
        document.querySelectorAll(".dd-multi.open").forEach((dd) => dd.classList.remove("open"));
      };

      document.querySelectorAll(".downton-dropdown-multi[data-group]").forEach((host) => {
        const group = host.getAttribute("data-group");
        if (!group) return;

        const noneEl = document.querySelector(`.downton-none[data-group='${group}']`);
        const optEls = Array.from(document.querySelectorAll(`.downton-opt[data-group='${group}']`));

        if (!noneEl && optEls.length === 0) return;

        const wrapper = document.createElement("div");
        wrapper.className = "dd-multi";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dd-multi-btn";
        btn.setAttribute("aria-haspopup", "listbox");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Seleccionar...";

        const menu = document.createElement("div");
        menu.className = "dd-multi-menu";
        menu.setAttribute("role", "listbox");

        const labelForInput = (inp) => {
          const lab = inp.closest("label");
          if (!lab) return "Opción";
          // Tomar texto limpio (sin saltos raros)
          return (lab.textContent || "").replace(/\s+/g, " ").trim();
        };

        const mirrors = new Map();

        const addItem = (inp) => {
          const item = document.createElement("label");
          item.className = "dd-multi-item";

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = !!inp.checked;

          const span = document.createElement("span");
          span.textContent = labelForInput(inp);

          cb.addEventListener("change", () => {
            inp.checked = cb.checked;
            inp.dispatchEvent(new Event("change", { bubbles: true }));
          });

          inp.addEventListener("change", () => {
            cb.checked = !!inp.checked;
            refreshButton();
          });

          item.appendChild(cb);
          item.appendChild(span);
          menu.appendChild(item);
          mirrors.set(inp, cb);
        };

        if (noneEl) addItem(noneEl);
        optEls.forEach(addItem);

        const getSelectedLabels = () => {
          const selected = optEls.filter((o) => o.checked).map((o) => labelForInput(o));
          if (selected.length === 0) {
            return noneEl ? labelForInput(noneEl) : "Ninguno";
          }
          if (selected.length <= 2) return selected.join(", ");
          return `${selected.length} seleccionados`;
        };

        const refreshButton = () => {
          btn.textContent = getSelectedLabels();
        };

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const isOpen = wrapper.classList.toggle("open");
          btn.setAttribute("aria-expanded", String(isOpen));
          if (isOpen) {
            // Sincronizar mirrors al abrir
            if (noneEl && mirrors.get(noneEl)) mirrors.get(noneEl).checked = !!noneEl.checked;
            optEls.forEach((o) => {
              const m = mirrors.get(o);
              if (m) m.checked = !!o.checked;
            });
            refreshButton();
          }
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(menu);

        // Reemplazar el host por el componente
        host.innerHTML = "";
        host.appendChild(wrapper);

        // Estado inicial
        refreshButton();
      });

      // Cerrar al dar click fuera / ESC
      document.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const inside = target.closest(".dd-multi");
        if (!inside) closeAllMulti();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAllMulti();
      });
    };

    initDowntonDropdowns();

    const downtonNotesToggle = document.getElementById("downton-notes-toggle");
    const downtonNotesPanel = document.getElementById("downton-notes-panel");
    const downtonNotes = document.getElementById("downton-notas");
    if (downtonNotesToggle && downtonNotesPanel) {
      const downtonCardEl = document.getElementById("downton-card");
      const downtonBodyEl = downtonCardEl ? downtonCardEl.querySelector(".scale-card-body") : null;

      const syncDowntonCardHeight = () => {
        if (downtonBodyEl && downtonCardEl && !downtonCardEl.classList.contains("is-collapsed")) {
          downtonBodyEl.style.maxHeight = downtonBodyEl.scrollHeight + "px";
        }
      };

      const setNotesOpen = (open) => {
        downtonNotesPanel.classList.toggle("is-hidden", !open);
        downtonNotesToggle.setAttribute("aria-expanded", String(open));
        downtonNotesToggle.textContent = open ? "Ocultar notas" : "Notas";
        syncDowntonCardHeight();
        if (open && downtonNotes) {
          window.requestAnimationFrame(() => downtonNotes.focus());
        }
      };

      downtonNotesToggle.addEventListener("click", () => {
        const isOpen = !downtonNotesPanel.classList.contains("is-hidden");
        setNotesOpen(!isOpen);
      });

      if (downtonNotes && String(downtonNotes.value || "").trim()) {
        setNotesOpen(true);
      } else {
        setNotesOpen(false);
      }
    }

    updateDowntonTotal();
  }

  // Exportaciones (PDF y Word)
  const btnPdf = document.getElementById("btn-download-pdf");
  const btnWord = document.getElementById("btn-download-word");

  const collectExportMutations = () => {
    const mutations = [];
    const hideEl = (el) => {
      if (!el || el.classList.contains("export-hide")) return;
      el.classList.add("export-hide");
      mutations.push(() => el.classList.remove("export-hide"));
    };

    document.querySelectorAll(".checkbox-group .checkbox-item").forEach((label) => {
      const input = label.querySelector('input[type="checkbox"], input[type="radio"]');
      if (input && !input.checked) hideEl(label);
    });

    document.querySelectorAll("#plan-egreso-section .field").forEach((field) => {
      const control = field.querySelector("textarea, input, select");
      if (!control) return;
      if (!String(control.value || "").trim()) hideEl(field);
    });

    document.querySelectorAll("#btn-add-sv, #btn-add-ft, .action-buttons").forEach(hideEl);

    return () => {
      mutations.reverse().forEach((undo) => undo());
    };
  };

  const buildPdfLayout = () => {
    document.body.classList.add("is-exporting-pdf");
    const undoSelectionFilter = collectExportMutations();

  const ftTable = document.getElementById("tabla-farmacoterapia");
    let restoreFarmaco = () => {};

    if (ftTable) {
      const ftWrapper = ftTable.closest(".table-wrapper");
      const ftSection = ftTable.closest("section");
      if (ftWrapper && ftSection) {
        ftWrapper.classList.add("hide-for-pdf");

        const existing = document.getElementById("ft-pdf-cards");
        if (existing) existing.remove();

        const cards = document.createElement("div");
        cards.id = "ft-pdf-cards";
        cards.className = "pdf-cards";

        const rows = Array.from(ftTable.querySelectorAll("tbody tr"));
        if (rows.length === 0) {
          const empty = document.createElement("div");
          empty.className = "pdf-card";
          empty.innerHTML = `
            <div class="pdf-card-title">Farmacoterapia</div>
            <div class="pdf-kv">
              <div class="pdf-k">Medicamentos</div><div class="pdf-v">—</div>
            </div>
          `;
          cards.appendChild(empty);
        } else {
          rows.forEach((tr, idx) => {
            const tds = tr.querySelectorAll("td");
            const getInputVal = (cellIndex) => {
              const cell = tds[cellIndex];
              const el = cell ? cell.querySelector("input, select, textarea") : null;
              if (!el) return "—";
              if (el.tagName === "SELECT") return (el.selectedOptions?.[0]?.textContent || "").trim() || "—";
              return (el.value || "").trim() || "—";
            };

            const catCell = tds[6];
            const catSelect = catCell ? catCell.querySelector("select") : null;
            const cateter = catSelect ? ((catSelect.selectedOptions?.[0]?.textContent || "").trim() || "—") : "—";

            const card = document.createElement("div");
            card.className = "pdf-card";
            card.innerHTML = `
              <div class="pdf-card-title">Medicamento ${idx + 1}</div>
              <div class="pdf-kv">
                <div class="pdf-k">Hora</div><div class="pdf-v">${getInputVal(0)}</div>
                <div class="pdf-k">Medicamento</div><div class="pdf-v">${getInputVal(1)}</div>
                <div class="pdf-k">Dosis</div><div class="pdf-v">${getInputVal(2)}</div>
                <div class="pdf-k">Dilución</div><div class="pdf-v">${getInputVal(3)}</div>
                <div class="pdf-k">Tiempo de infusión</div><div class="pdf-v">${getInputVal(4)}</div>
                <div class="pdf-k">Vía</div><div class="pdf-v">${getInputVal(5)}</div>
                <div class="pdf-k">Tipo de catéter</div><div class="pdf-v">${cateter}</div>
              </div>
            `;
            cards.appendChild(card);
          });
        }

        ftSection.insertBefore(cards, ftWrapper);
        restoreFarmaco = () => {
          document.getElementById("ft-pdf-cards")?.remove();
          ftWrapper.classList.remove("hide-for-pdf");
        };
      }
    }

    const downtonCard = document.getElementById("downton-card");
    let restoreDownton = () => {};
    if (downtonCard) {
      const downtonBody = downtonCard.querySelector(".scale-card-body");
      if (downtonBody) {
        downtonBody.classList.add("hide-for-pdf");
        const existing = document.getElementById("downton-pdf-summary");
        if (existing) existing.remove();

        const summary = document.createElement("div");
        summary.id = "downton-pdf-summary";
        summary.className = "pdf-cards";

        const totalScore = document.getElementById("downton-total")?.value || "0";
        const notas = (document.getElementById("downton-notas")?.value || "").trim();
        
        const getGroupSelections = (groupKey) => {
          const host = document.querySelector(`.downton-dropdown-multi[data-group='${groupKey}']`);
          return host ? (host.querySelector(".dd-multi-btn")?.textContent || "Ninguno (0)") : "—";
        };

        const card = document.createElement("div");
        card.className = "pdf-card";
        card.innerHTML = `
          <div class="pdf-card-title">Resumen: Riesgo de caídas (J.H. Downton)</div>
          <div class="pdf-kv">
            <div class="pdf-k">Puntaje total</div><div class="pdf-v" style="font-weight:bold;">${totalScore}</div>
            <div class="pdf-k">Caídas previas</div><div class="pdf-v">${getSelectText(document.getElementById("downton-caidas-select"))}</div>
            <div class="pdf-k">Medicamentos</div><div class="pdf-v">${getGroupSelections("meds")}</div>
            <div class="pdf-k">Déficits sensoriales</div><div class="pdf-v">${getGroupSelections("sens")}</div>
            <div class="pdf-k">Estado mental</div><div class="pdf-v">${getSelectText(document.getElementById("downton-mental-select"))}</div>
            <div class="pdf-k">Deambulación</div><div class="pdf-v">${getSelectText(document.getElementById("downton-marcha-select"))}</div>
            <div class="pdf-k">Notas</div><div class="pdf-v">${notas || "—"}</div>
          </div>
        `;
        summary.appendChild(card);
        downtonCard.appendChild(summary);

        restoreDownton = () => {
          document.getElementById("downton-pdf-summary")?.remove();
          downtonBody.classList.remove("hide-for-pdf");
        };
      }
    }

    return () => {
      restoreFarmaco();
      restoreDownton();
      undoSelectionFilter();
      document.body.classList.remove("is-exporting-pdf");
    };
  };

  const collectCollapsibleState = () => {
    const collapsibles = Array.from(document.querySelectorAll(".scale-card-collapsible"));
    const wasCollapsed = collapsibles.map((card) => card.classList.contains("is-collapsed"));

    collapsibles.forEach((card) => {
      card.classList.remove("is-collapsed");
      const header = card.querySelector(".scale-card-header");
      const body = card.querySelector(".scale-card-body");
      if (header) header.setAttribute("aria-expanded", "true");
      if (body) body.style.maxHeight = body.scrollHeight + "px";
    });

    return () => {
      collapsibles.forEach((card, idx) => {
        const header = card.querySelector(".scale-card-header");
        const body = card.querySelector(".scale-card-body");
        const expanded = !wasCollapsed[idx];
        card.classList.toggle("is-collapsed", !expanded);
        if (header) header.setAttribute("aria-expanded", String(expanded));
        if (body) body.style.maxHeight = expanded ? (body.scrollHeight + "px") : "0px";
      });
    };
  };

  if (btnPdf) {
    btnPdf.addEventListener("click", () => {
      saveActiveSheet();
      const wrapper = document.getElementById("hoja-enfermeria");
      if (!wrapper || !window.jspdf) return;

      const restoreCollapsibles = collectCollapsibleState();
      const restorePdfLayout = buildPdfLayout();
      const { jsPDF } = window.jspdf;

      html2canvas(wrapper, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let imgWidth = pageWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          imgWidth *= ratio;
          imgHeight *= ratio;
        }

        const x = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);

        let nombre = document.getElementById("nombre")?.value || "paciente";
        let expediente = document.getElementById("expediente")?.value || "expediente";
        let fecha = document.getElementById("fecha")?.value || new Date().toISOString().split("T")[0];

        nombre = sanitizeForFileName(nombre) || "paciente";
        expediente = sanitizeForFileName(expediente) || "expediente";
        fecha = fecha.replace(/[^0-9\-]/g, "_");

        pdf.save(`sanare_${nombre}_${expediente}_${fecha}.pdf`);
      }).catch((err) => {
        console.error("Error al generar PDF:", err);
      }).finally(() => {
        restoreCollapsibles();
        restorePdfLayout();
      });
    });
  }

  if (btnWord) {
    btnWord.addEventListener("click", () => {
      saveActiveSheet();
      const wrapperClone = cloneExportWrapper();
      if (!wrapperClone) return;

      const nombre = sanitizeForFileName(document.getElementById("nombre")?.value || "paciente") || "paciente";
      const expediente = sanitizeForFileName(document.getElementById("expediente")?.value || "expediente") || "expediente";
      const fecha = (document.getElementById("fecha")?.value || new Date().toISOString().split("T")[0]).replace(/[^0-9\-]/g, "_");

      const html = buildWordExportHtml(wrapperClone);
      const blob = new Blob(["﻿", html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sanare_${nombre}_${expediente}_${fecha}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
});


// Mostrar texto completo de opciones largas (Escalas de valoración)
function initSelectedPreviews(){
  const previews = document.querySelectorAll('.selected-preview[data-for]');
  if(!previews.length) return;
  previews.forEach(div=>{
    const id = div.getAttribute('data-for');
    const sel = document.getElementById(id);
    if(!sel) return;
    sel.addEventListener('change', () => refreshSelectedPreviews());
  });
  refreshSelectedPreviews();
}
