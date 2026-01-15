
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


    updateDowntonTotal();
  }

  // Descargar PDF usando html2canvas + jsPDF, igual que el cotizador
  const btnPdf = document.getElementById("btn-download-pdf");
  if (btnPdf) {
    btnPdf.addEventListener("click", () => {
      const wrapper = document.getElementById("hoja-enfermeria");
      if (!wrapper) return;

      // --- Preparación visual para PDF ---
      // html2canvas NO captura contenido fuera de la vista cuando hay scroll horizontal.
      // Para evitar que Farmacoterapia se vea cortada, convertimos la tabla a una versión
      // “tarjeta” temporal (solo durante la exportación) que se ajusta al ancho del PDF.
      const preparePdfLayout = () => {
        document.body.classList.add('is-exporting-pdf');

        const ftTable = document.getElementById('tabla-farmacoterapia');
        if (!ftTable) return;

        const ftWrapper = ftTable.closest('.table-wrapper');
        const ftSection = ftTable.closest('section');
        if (!ftWrapper || !ftSection) return;

        // Ocultar la tabla (para PDF) y construir tarjetas con los valores seleccionados
        ftWrapper.classList.add('hide-for-pdf');

        // Evitar duplicados
        const existing = document.getElementById('ft-pdf-cards');
        if (existing) existing.remove();

        const cards = document.createElement('div');
        cards.id = 'ft-pdf-cards';
        cards.className = 'pdf-cards';

        const rows = Array.from(ftTable.querySelectorAll('tbody tr'));
        if (rows.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'pdf-card';
          empty.innerHTML = `
            <div class="pdf-card-title">Farmacoterapia</div>
            <div class="pdf-kv">
              <div class="pdf-k">Medicamentos</div><div class="pdf-v">—</div>
            </div>
          `;
          cards.appendChild(empty);
        } else {
          rows.forEach((tr, idx) => {
            const tds = tr.querySelectorAll('td');
            const getInputVal = (cellIndex) => {
              const cell = tds[cellIndex];
              const el = cell ? cell.querySelector('input, select, textarea') : null;
              if (!el) return '—';
              if (el.tagName === 'SELECT') {
                return (el.selectedOptions?.[0]?.textContent || '').trim() || '—';
              }
              return (el.value || '').trim() || '—';
            };

            const hora = getInputVal(0);
            const medicamento = getInputVal(1);
            const dosis = getInputVal(2);
            const dilucion = getInputVal(3);
            const tiempo = getInputVal(4);
            const via = getInputVal(5);
            // En la celda de catéter hay select + botón X; tomamos el select
            const catCell = tds[6];
            const catSelect = catCell ? catCell.querySelector('select') : null;
            const cateter = catSelect ? ((catSelect.selectedOptions?.[0]?.textContent || '').trim() || '—') : '—';

            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.innerHTML = `
              <div class="pdf-card-title">Medicamento ${idx + 1}</div>
              <div class="pdf-kv">
                <div class="pdf-k">Hora</div><div class="pdf-v">${hora}</div>
                <div class="pdf-k">Medicamento</div><div class="pdf-v">${medicamento}</div>
                <div class="pdf-k">Dosis</div><div class="pdf-v">${dosis}</div>
                <div class="pdf-k">Dilución</div><div class="pdf-v">${dilucion}</div>
                <div class="pdf-k">Tiempo de infusión</div><div class="pdf-v">${tiempo}</div>
                <div class="pdf-k">Vía</div><div class="pdf-v">${via}</div>
                <div class="pdf-k">Tipo de catéter</div><div class="pdf-v">${cateter}</div>
              </div>
            `;
            cards.appendChild(card);
          });
        }

        // Insertar las tarjetas justo donde está la tabla
        ftSection.insertBefore(cards, ftWrapper);
      };

      const restorePdfLayout = () => {
        document.body.classList.remove('is-exporting-pdf');
        const cards = document.getElementById('ft-pdf-cards');
        if (cards) cards.remove();
        const ftTable = document.getElementById('tabla-farmacoterapia');
        const ftWrapper = ftTable ? ftTable.closest('.table-wrapper') : null;
        if (ftWrapper) ftWrapper.classList.remove('hide-for-pdf');
      };

      // jsPDF viene del bundle de html2pdf
      if (!window.jspdf) {
        console.error("jsPDF no disponible");
        return;
      }
      const { jsPDF } = window.jspdf;

      // Asegurar que las secciones desplegables salgan completas en el PDF
      const collapsibles = Array.from(document.querySelectorAll('.scale-card-collapsible'));
      const wasCollapsed = collapsibles.map((card) => card.classList.contains('is-collapsed'));

      const expandForPdf = () => {
        collapsibles.forEach((card) => {
          card.classList.remove('is-collapsed');
          const header = card.querySelector('.scale-card-header');
          const body = card.querySelector('.scale-card-body');
          if (header) header.setAttribute('aria-expanded', 'true');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        });
      };

      const restoreCollapsibles = () => {
        collapsibles.forEach((card, idx) => {
          const header = card.querySelector('.scale-card-header');
          const body = card.querySelector('.scale-card-body');
          const expanded = !wasCollapsed[idx];
          card.classList.toggle('is-collapsed', !expanded);
          if (header) header.setAttribute('aria-expanded', String(expanded));
          if (body) body.style.maxHeight = expanded ? (body.scrollHeight + 'px') : '0px';
        });
      };

      expandForPdf();
      preparePdfLayout();

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
      }).catch((err) => {
        console.error('Error al generar PDF:', err);
      }).finally(() => {
        restoreCollapsibles();
        restorePdfLayout();
      });
    });
  }
});


// Mostrar texto completo de opciones largas (Escalas de valoración)
(function initSelectedPreviews(){
  const previews = document.querySelectorAll('.selected-preview[data-for]');
  if(!previews.length) return;
  previews.forEach(div=>{
    const id = div.getAttribute('data-for');
    const sel = document.getElementById(id);
    if(!sel) return;

    const update = () => {
      const opt = sel.options[sel.selectedIndex];
      const txt = opt ? opt.text : '';
      sel.title = txt || '';
      div.textContent = txt || '';
      div.style.display = sel.value ? 'block' : 'none';
    };

    sel.addEventListener('change', update);
    update();
  });
})();

