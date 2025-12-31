
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
  viaCell.className = "cell-with-x";
  const viaSelect = document.createElement("select");
  ["", "IV", "VO", "IM", "SC", "Otro"].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt === "" ? "Seleccionar…" : opt;
    viaSelect.appendChild(o);
  });
  viaCell.appendChild(viaSelect);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "icon-btn";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", () => {
    tableBody.removeChild(row);
  });
  viaCell.appendChild(delBtn);

  row.appendChild(horaCell);
  row.appendChild(medCell);
  row.appendChild(dosisCell);
  row.appendChild(dilCell);
  row.appendChild(tiempoCell);
  row.appendChild(viaCell);

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

    updateDowntonTotal();
  }

  // Descargar PDF usando html2canvas + jsPDF, igual que el cotizador
  const btnPdf = document.getElementById("btn-download-pdf");
  if (btnPdf) {
    btnPdf.addEventListener("click", () => {
      const wrapper = document.getElementById("hoja-enfermeria");
      if (!wrapper) return;

      // jsPDF viene del bundle de html2pdf
      if (!window.jspdf) {
        console.error("jsPDF no disponible");
        return;
      }
      const { jsPDF } = window.jspdf;

      html2canvas(wrapper, {
        scale: 2,
        useCORS: true
      }).then((canvas) => {
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

        // Nombre del archivo: sanare_paciente_expediente_fecha
        let nombre = document.getElementById("nombre")?.value || "paciente";
        let expediente = document.getElementById("expediente")?.value || "expediente";
        let fecha = document.getElementById("fecha")?.value || new Date().toISOString().split("T")[0];

        nombre = sanitizeForFileName(nombre) || "paciente";
        expediente = sanitizeForFileName(expediente) || "expediente";
        fecha = fecha.replace(/[^0-9\-]/g, "_");

        const fileName = `sanare_${nombre}_${expediente}_${fecha}.pdf`;
        pdf.save(fileName);
      });
    });
  }
});
