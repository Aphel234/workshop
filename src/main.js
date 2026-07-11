import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { createSampleData } from "./sample-data.js";
import { normalizeEvent, optimizeEvent, validateEvent } from "./optimizer.js";

const STORAGE_KEY = "workshop-zuteilung-github-pages-v1";
let state = loadState();
let result = null;
let saveTimer = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeEvent(JSON.parse(saved)) : createSampleData();
  } catch {
    return createSampleData();
  }
}

function scheduleSave() {
  $("#saveState").textContent = "speichert …";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $("#saveState").textContent = "lokal gespeichert";
  }, 250);
}

function invalidateResult() {
  result = null;
  renderResults();
}

function commit({ invalidate = true } = {}) {
  state = normalizeEvent(state);
  scheduleSave();
  if (invalidate) invalidateResult();
  renderDashboard();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function option(value, selected, label = value) {
  return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function showDialog(title, messages, type = "error") {
  $("#dialogTitle").textContent = title;
  const list = Array.isArray(messages) ? messages : [messages];
  $("#dialogBody").innerHTML = list.map((message) => `<div class="message ${type}">${escapeHtml(message)}</div>`).join("");
  $("#messageDialog").showModal();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function safeFilename(value) {
  return String(value || "datei").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
}

function renderDashboard() {
  $("#eventName").value = state.name;
  $("#allowOutside").value = String(state.settings.allowOutside);
  $("#defaultMode").value = state.settings.defaultMode;
  $("#balanceWeight").value = state.settings.balanceWeight;

  const validation = validateEvent(state);
  const cards = [
    [state.participants.length, "Teilnehmer"],
    [state.workshops.length, "Workshops"],
    [state.workshops.filter((w) => w.mode === "Pflicht").length, "Pflichtkurse"],
    [state.locks.length, "Sperrungen"],
    [state.participants.filter((p) => p.fixed).length, "Feste Setzungen"],
  ];
  $("#stats").innerHTML = cards.map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join("");

  const messages = [];
  validation.errors.forEach((message) => messages.push(`<div class="message error">${escapeHtml(message)}</div>`));
  validation.warnings.slice(0, 12).forEach((message) => messages.push(`<div class="message warning">${escapeHtml(message)}</div>`));
  if (!messages.length) messages.push(`<div class="message">Eingaben sind grundsätzlich plausibel.</div>`);
  if (validation.warnings.length > 12) messages.push(`<div class="message warning">Weitere ${validation.warnings.length - 12} Warnungen werden beim Berechnen angezeigt.</div>`);
  $("#validationSummary").innerHTML = messages.join("");
}

function renderWorkshops() {
  const rows = state.workshops.map((w, index) => `
    <tr data-index="${index}">
      <td class="row-number">${index + 1}</td>
      <td><input data-entity="workshop" data-field="id" value="${escapeHtml(w.id)}"></td>
      <td><input data-entity="workshop" data-field="name" value="${escapeHtml(w.name)}"></td>
      <td><input type="number" min="1" max="20" data-entity="workshop" data-field="gradeFrom" value="${w.gradeFrom}"></td>
      <td><input type="number" min="1" max="20" data-entity="workshop" data-field="gradeTo" value="${w.gradeTo}"></td>
      <td><select data-entity="workshop" data-field="schoolForm">${["Alle", "Regional", "Gymnasial"].map((v) => option(v, w.schoolForm)).join("")}</select></td>
      <td><input type="number" min="0" max="500" data-entity="workshop" data-field="min" value="${w.min}"></td>
      <td><input type="number" min="1" max="500" data-entity="workshop" data-field="max" value="${w.max}"></td>
      <td><select data-entity="workshop" data-field="mode">${["Pflicht", "Optional"].map((v) => option(v, w.mode)).join("")}</select></td>
      <td><button class="icon-button" data-action="delete-workshop" title="Löschen">×</button></td>
    </tr>`).join("");
  $("#workshopsTable").innerHTML = `
    <thead><tr><th>#</th><th>ID</th><th>Workshop</th><th>Klasse von</th><th>Klasse bis</th><th>Schulform</th><th>Minimum</th><th>Maximum</th><th>Durchführung</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="10">Keine Workshops eingetragen.</td></tr>`}</tbody>`;
}

function renderParticipants() {
  const query = $("#participantSearch").value.trim().toLowerCase();
  const workshopOptions = [`<option value="">–</option>`, ...state.workshops.map((w) => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.id)} · ${escapeHtml(w.name)}</option>`)].join("");
  const visible = state.participants.map((p, index) => ({ p, index })).filter(({ p }) => {
    if (!query) return true;
    return [p.id, p.firstName, p.lastName, p.className, p.schoolForm].join(" ").toLowerCase().includes(query);
  });

  const rows = visible.map(({ p, index }) => {
    const wishSelect = (slot) => `<select data-entity="participant" data-field="wish${slot}">${workshopOptions.replace(`value="${escapeHtml(p.wishes[slot])}"`, `value="${escapeHtml(p.wishes[slot])}" selected`)}</select>`;
    const fixedSelect = `<select data-entity="participant" data-field="fixed">${workshopOptions.replace(`value="${escapeHtml(p.fixed)}"`, `value="${escapeHtml(p.fixed)}" selected`)}</select>`;
    return `<tr data-index="${index}">
      <td class="row-number">${index + 1}</td>
      <td><input data-entity="participant" data-field="id" value="${escapeHtml(p.id)}"></td>
      <td><input data-entity="participant" data-field="firstName" value="${escapeHtml(p.firstName)}"></td>
      <td><input data-entity="participant" data-field="lastName" value="${escapeHtml(p.lastName)}"></td>
      <td><input data-entity="participant" data-field="className" value="${escapeHtml(p.className)}"></td>
      <td><select data-entity="participant" data-field="schoolForm">${["Regional", "Gymnasial"].map((v) => option(v, p.schoolForm)).join("")}</select></td>
      <td>${wishSelect(0)}</td><td>${wishSelect(1)}</td><td>${wishSelect(2)}</td><td>${wishSelect(3)}</td>
      <td>${fixedSelect}</td>
      <td><button class="icon-button" data-action="delete-participant" title="Löschen">×</button></td>
    </tr>`;
  }).join("");

  $("#participantsTable").innerHTML = `
    <thead><tr><th>#</th><th>Person-ID</th><th>Vorname</th><th>Nachname</th><th>Klasse</th><th>Schulform</th><th>1. Wunsch</th><th>2. Wunsch</th><th>3. Wunsch</th><th>4. Wunsch</th><th>Feste Setzung</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="12">Keine passenden Teilnehmer.</td></tr>`}</tbody>`;
}

function renderLocks() {
  const personOptions = [`<option value="">–</option>`, ...state.participants.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.id)} · ${escapeHtml(p.lastName)}, ${escapeHtml(p.firstName)}</option>`)].join("");
  const workshopOptions = [`<option value="">–</option>`, ...state.workshops.map((w) => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.id)} · ${escapeHtml(w.name)}</option>`)].join("");
  const rows = state.locks.map((lock, index) => `
    <tr data-index="${index}">
      <td class="row-number">${index + 1}</td>
      <td><select data-entity="lock" data-field="personId">${personOptions.replace(`value="${escapeHtml(lock.personId)}"`, `value="${escapeHtml(lock.personId)}" selected`)}</select></td>
      <td><select data-entity="lock" data-field="workshopId">${workshopOptions.replace(`value="${escapeHtml(lock.workshopId)}"`, `value="${escapeHtml(lock.workshopId)}" selected`)}</select></td>
      <td><input data-entity="lock" data-field="reason" value="${escapeHtml(lock.reason)}"></td>
      <td><button class="icon-button" data-action="delete-lock" title="Löschen">×</button></td>
    </tr>`).join("");
  $("#locksTable").innerHTML = `
    <thead><tr><th>#</th><th>Person</th><th>Workshop</th><th>Grund</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="5">Keine Sperrungen eingetragen.</td></tr>`}</tbody>`;
}

function statCards(stats) {
  const items = [
    [stats.first, "Erstwünsche"], [stats.second, "Zweitwünsche"], [stats.third, "Drittwünsche"],
    [stats.fourth, "Viertwünsche"], [stats.fixed, "Feste Setzungen"], [stats.outside, "Außerhalb Wünsche"],
    [stats.unassigned, "Nicht zugeteilt"], [stats.meanDeviation.toFixed(2), "Ø Zielabweichung"],
  ];
  return items.map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
}

function renderResults() {
  const placeholder = $("#resultPlaceholder");
  const content = $("#resultContent");
  if (!result?.ok) {
    placeholder.hidden = false;
    content.hidden = true;
    return;
  }
  placeholder.hidden = true;
  content.hidden = false;
  $("#resultStats").innerHTML = statCards(result.stats);
  $("#courseResultsTable").innerHTML = `
    <thead><tr><th>ID</th><th>Workshop</th><th>Durchführung</th><th>Minimum</th><th>Ziel</th><th>Belegung</th><th>Maximum</th><th>Abweichung</th><th>Status</th></tr></thead>
    <tbody>${result.courseResults.map((course) => `<tr>
      <td>${escapeHtml(course.id)}</td><td>${escapeHtml(course.name)}</td><td>${escapeHtml(course.mode)}</td>
      <td>${course.effectiveMin}</td><td>${course.target}</td><td>${course.load}</td><td>${course.max}</td><td>${course.deviation}</td>
      <td><span class="badge ${course.open ? "good" : "warn"}">${escapeHtml(course.status)}</span></td>
    </tr>`).join("")}</tbody>`;
  $("#participantResultsTable").innerHTML = `
    <thead><tr><th>Nachname</th><th>Vorname</th><th>Klasse</th><th>Workshop</th><th>Zuteilungsart</th><th>Hinweis</th></tr></thead>
    <tbody>${[...result.participantResults].sort((a, b) => a.lastName.localeCompare(b.lastName, "de") || a.firstName.localeCompare(b.firstName, "de")).map((row) => `<tr>
      <td>${escapeHtml(row.lastName)}</td><td>${escapeHtml(row.firstName)}</td><td>${escapeHtml(row.className)}</td>
      <td>${escapeHtml(row.workshopName || "–")}</td><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.note)}</td>
    </tr>`).join("")}</tbody>`;
}

function renderAll() {
  renderDashboard();
  renderWorkshops();
  renderParticipants();
  renderLocks();
  renderResults();
}

function runOptimization() {
  const calculated = optimizeEvent(state);
  if (!calculated.ok) {
    showDialog("Zuteilung nicht möglich", calculated.errors, "error");
    return;
  }
  result = calculated;
  renderResults();
  if (calculated.warnings.length) showDialog("Zuteilung berechnet – mit Hinweisen", calculated.warnings, "warning");
  else toast("Zuteilung erfolgreich berechnet.");
  activateTab("results");
}

function activateTab(name) {
  $$(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === name));
  $$(".panel").forEach((panel) => panel.classList.toggle("active-panel", panel.dataset.panel === name));
}

function nextId(prefix, existing) {
  for (let i = 1; i <= 9999; i += 1) {
    const id = `${prefix}${String(i).padStart(2, "0")}`;
    if (!existing.has(id)) return id;
  }
  return "";
}

function addWorkshop() {
  if (state.workshops.length >= 30) return showDialog("Grenze erreicht", "Es können höchstens 30 Workshops eingetragen werden.", "warning");
  state.workshops.push({
    id: nextId("W", new Set(state.workshops.map((w) => w.id))), name: "Neuer Workshop", gradeFrom: 7, gradeTo: 12,
    schoolForm: "Alle", min: 0, max: 12, mode: state.settings.defaultMode,
  });
  commit(); renderWorkshops(); renderParticipants(); renderLocks();
}

function addParticipant() {
  if (state.participants.length >= 500) return showDialog("Grenze erreicht", "Es können höchstens 500 Teilnehmer eingetragen werden.", "warning");
  state.participants.push({
    id: nextId("P", new Set(state.participants.map((p) => p.id))), firstName: "", lastName: "", className: "7a",
    schoolForm: "Regional", wishes: ["", "", "", ""], fixed: "",
  });
  commit(); renderParticipants(); renderLocks();
}

function addLock() {
  state.locks.push({ personId: "", workshopId: "", reason: "" });
  commit(); renderLocks();
}

function handleTableChange(event) {
  const control = event.target.closest("[data-entity]");
  if (!control) return;
  const row = control.closest("tr");
  const index = Number(row?.dataset.index);
  const field = control.dataset.field;
  let value = control.value;
  if (control.type === "number") value = Number(value);

  if (control.dataset.entity === "workshop") state.workshops[index][field] = value;
  if (control.dataset.entity === "participant") {
    if (field.startsWith("wish")) state.participants[index].wishes[Number(field.slice(4))] = value;
    else state.participants[index][field] = value;
  }
  if (control.dataset.entity === "lock") state.locks[index][field] = value;
  commit();
}

function handleTableClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const index = Number(button.closest("tr")?.dataset.index);
  if (button.dataset.action === "delete-workshop") {
    const removed = state.workshops[index];
    state.workshops.splice(index, 1);
    state.participants.forEach((p) => {
      p.wishes = p.wishes.map((wish) => wish === removed.id ? "" : wish);
      if (p.fixed === removed.id) p.fixed = "";
    });
    state.locks = state.locks.filter((lock) => lock.workshopId !== removed.id);
    commit(); renderWorkshops(); renderParticipants(); renderLocks();
  }
  if (button.dataset.action === "delete-participant") {
    const removed = state.participants[index];
    state.participants.splice(index, 1);
    state.locks = state.locks.filter((lock) => lock.personId !== removed.id);
    commit(); renderParticipants(); renderLocks();
  }
  if (button.dataset.action === "delete-lock") {
    state.locks.splice(index, 1); commit(); renderLocks();
  }
}

function exportJson() {
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), `${safeFilename(state.name)}.json`);
}

async function importJson(file) {
  const parsed = JSON.parse(await file.text());
  state = normalizeEvent(parsed);
  result = null;
  scheduleSave(); renderAll(); toast("JSON-Datei geladen.");
}

function getRowValue(row, aliases) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
  for (const alias of aliases) {
    const value = normalized[alias.toLowerCase()];
    if (value !== undefined && value !== null) return value;
  }
  return "";
}

function worksheetObjects(worksheet, requiredHeader) {
  if (!worksheet) return [];
  let headerRow = null;
  let headers = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerRow || rowNumber > 15) return;
    const values = row.values.slice(1).map((value) => String(value ?? "").trim());
    if (values.some((value) => value.toLowerCase() === requiredHeader.toLowerCase())) {
      headerRow = rowNumber;
      headers = values;
    }
  });
  if (!headerRow) return [];
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRow) return;
    const object = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const cell = row.getCell(index + 1);
      object[header] = cell.text ?? cell.value ?? "";
    });
    rows.push(object);
  });
  return rows;
}

function parseExcelWorkbook(workbook) {
  const workshops = worksheetObjects(workbook.getWorksheet("Workshops"), "Workshop-ID").map((row) => ({
    id: String(getRowValue(row, ["Workshop-ID", "ID"])).trim(),
    name: String(getRowValue(row, ["Workshopname", "Workshop", "Name"])).trim(),
    gradeFrom: Number(getRowValue(row, ["Klasse von", "Von"])),
    gradeTo: Number(getRowValue(row, ["Klasse bis", "Bis"])),
    schoolForm: String(getRowValue(row, ["Schulform"]) || "Alle").trim(),
    min: Number(getRowValue(row, ["Mindestbelegung", "Minimum", "Min"])) || 0,
    max: Number(getRowValue(row, ["Maximalbelegung", "Maximum", "Max"])) || 0,
    mode: String(getRowValue(row, ["Durchführung", "Durchfuehrung"]) || state.settings.defaultMode).trim(),
  })).filter((row) => row.id);

  const participants = worksheetObjects(workbook.getWorksheet("Personen"), "Person-ID").map((row) => ({
    id: String(getRowValue(row, ["Person-ID", "ID"])).trim(),
    firstName: String(getRowValue(row, ["Vorname"])).trim(),
    lastName: String(getRowValue(row, ["Nachname"])).trim(),
    className: String(getRowValue(row, ["Klasse"])).trim(),
    schoolForm: String(getRowValue(row, ["Schulform"]) || "Regional").trim(),
    wishes: ["Erstwunsch", "Zweitwunsch", "Drittwunsch", "Viertwunsch"].map((key) => String(getRowValue(row, [key])).trim()),
    fixed: String(getRowValue(row, ["Feste Setzung"])).trim(),
  })).filter((row) => row.id);

  const locks = worksheetObjects(workbook.getWorksheet("Sperrungen"), "Person-ID").map((row) => ({
    personId: String(getRowValue(row, ["Person-ID", "Person"])).trim(),
    workshopId: String(getRowValue(row, ["Workshop-ID", "Workshop"])).trim(),
    reason: String(getRowValue(row, ["Grund / Hinweis", "Grund", "Hinweis"])).trim(),
  })).filter((row) => row.personId || row.workshopId);

  if (!workshops.length || !participants.length) throw new Error("Die Blätter „Workshops“ und „Personen“ wurden nicht erkannt oder enthalten keine Daten.");
  return normalizeEvent({ ...state, workshops, participants, locks });
}

async function importExcel(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  state = parseExcelWorkbook(workbook);
  result = null; scheduleSave(); renderAll(); toast("Excel-Datei importiert.");
}

function styleWorksheet(worksheet) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  worksheet.columns.forEach((column) => {
    let width = 12;
    column.eachCell({ includeEmpty: true }, (cell) => { width = Math.min(38, Math.max(width, String(cell.text ?? "").length + 2)); });
    column.width = width;
  });
}

async function exportExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Workshop-Zuteilung";
  const addTableSheet = (name, columns, rows) => {
    const worksheet = workbook.addWorksheet(name);
    worksheet.columns = columns.map(([header, key]) => ({ header, key }));
    worksheet.addRows(rows);
    styleWorksheet(worksheet);
  };
  addTableSheet("Workshops", [
    ["Workshop-ID", "id"], ["Workshopname", "name"], ["Klasse von", "gradeFrom"], ["Klasse bis", "gradeTo"],
    ["Schulform", "schoolForm"], ["Mindestbelegung", "min"], ["Maximalbelegung", "max"], ["Durchführung", "mode"],
  ], state.workshops);
  addTableSheet("Personen", [
    ["Person-ID", "id"], ["Vorname", "firstName"], ["Nachname", "lastName"], ["Klasse", "className"], ["Schulform", "schoolForm"],
    ["Erstwunsch", "wish1"], ["Zweitwunsch", "wish2"], ["Drittwunsch", "wish3"], ["Viertwunsch", "wish4"], ["Feste Setzung", "fixed"],
  ], state.participants.map((p) => ({ ...p, wish1: p.wishes[0], wish2: p.wishes[1], wish3: p.wishes[2], wish4: p.wishes[3] })));
  addTableSheet("Sperrungen", [["Person-ID", "personId"], ["Workshop-ID", "workshopId"], ["Grund / Hinweis", "reason"]], state.locks);
  if (result?.ok) {
    addTableSheet("Ergebnis", [["Nachname", "lastName"], ["Vorname", "firstName"], ["Klasse", "className"], ["Workshop", "workshopName"], ["Zuteilungsart", "type"], ["Hinweis", "note"]], result.participantResults);
    addTableSheet("Kursübersicht", [["Workshop", "name"], ["Durchführung", "mode"], ["Minimum", "effectiveMin"], ["Ziel", "target"], ["Belegung", "load"], ["Maximum", "max"], ["Abweichung", "deviation"], ["Status", "status"]], result.courseResults);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${safeFilename(state.name)}.xlsx`);
}

function ensureResult() {
  if (result?.ok) return true;
  showDialog("Noch kein Ergebnis", "Bitte zuerst die Zuteilung berechnen.", "warning");
  return false;
}

function addPdfHeader(doc, title, subtitle) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(title, 14, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(subtitle, 14, 25);
}

async function exportCoursePdfs() {
  if (!ensureResult()) return;
  const zip = new JSZip();
  for (const course of result.courseResults.filter((c) => c.open)) {
    const persons = result.participantResults
      .filter((p) => p.workshopId === course.id)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "de") || a.firstName.localeCompare(b.firstName, "de"));
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    addPdfHeader(doc, `Teilnehmerliste: ${course.name}`, `Klasse ${course.gradeFrom}–${course.gradeTo} · Belegung ${course.load} · Ziel ${course.target} · Maximum ${course.max}`);
    autoTable(doc, {
      startY: 31,
      head: [["Nr.", "Nachname", "Vorname", "Klasse", "Zuteilungsart"]],
      body: persons.map((p, i) => [i + 1, p.lastName, p.firstName, String(p.className), p.type]),
      styles: { font: "helvetica", fontSize: 9 },
      headStyles: { fillColor: [31, 78, 120] },
    });
    zip.file(`${safeFilename(course.name)}.pdf`, doc.output("arraybuffer"));
  }
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${safeFilename(state.name)}_Kurslisten.zip`);
}

async function exportClassPdfs() {
  if (!ensureResult()) return;
  const zip = new JSZip();
  const classes = [...new Set(result.participantResults.map((p) => p.className))].sort((a, b) => String(a).localeCompare(String(b), "de", { numeric: true }));
  for (const className of classes) {
    const persons = result.participantResults
      .filter((p) => p.className === className)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "de") || a.firstName.localeCompare(b.firstName, "de"));
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    addPdfHeader(doc, `Klassenliste: ${className}`, "Alphabetisch nach Nachname und Vorname");
    autoTable(doc, {
      startY: 31,
      head: [["Nr.", "Nachname", "Vorname", "Workshop", "Zuteilungsart"]],
      body: persons.map((p, i) => [i + 1, p.lastName, p.firstName, p.workshopName || "Nicht zugeteilt", p.type]),
      styles: { font: "helvetica", fontSize: 9 },
      headStyles: { fillColor: [31, 78, 120] },
    });
    zip.file(`Klasse_${safeFilename(className)}.pdf`, doc.output("arraybuffer"));
  }
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${safeFilename(state.name)}_Klassenlisten.zip`);
}

function bindEvents() {
  $("#tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) activateTab(button.dataset.tab);
  });
  $("#eventName").addEventListener("input", (event) => { state.name = event.target.value; commit({ invalidate: false }); });
  $("#allowOutside").addEventListener("change", (event) => { state.settings.allowOutside = event.target.value === "true"; commit(); });
  $("#defaultMode").addEventListener("change", (event) => { state.settings.defaultMode = event.target.value; commit({ invalidate: false }); });
  $("#balanceWeight").addEventListener("change", (event) => { state.settings.balanceWeight = Number(event.target.value) || 0; commit(); });
  $("#workshopsTable").addEventListener("change", handleTableChange);
  $("#participantsTable").addEventListener("change", handleTableChange);
  $("#locksTable").addEventListener("change", handleTableChange);
  $("#workshopsTable").addEventListener("click", handleTableClick);
  $("#participantsTable").addEventListener("click", handleTableClick);
  $("#locksTable").addEventListener("click", handleTableClick);
  $("#participantSearch").addEventListener("input", renderParticipants);
  $("#addWorkshopBtn").addEventListener("click", addWorkshop);
  $("#addParticipantBtn").addEventListener("click", addParticipant);
  $("#addLockBtn").addEventListener("click", addLock);
  $("#optimizeBtn").addEventListener("click", runOptimization);
  $("#optimizeBtnSecondary").addEventListener("click", runOptimization);
  $("#sampleBtn").addEventListener("click", () => {
    if (!confirm("Aktuelle Daten durch die Beispieldaten ersetzen?")) return;
    state = createSampleData(); result = null; scheduleSave(); renderAll(); toast("Beispieldaten geladen.");
  });
  $("#jsonExportBtn").addEventListener("click", exportJson);
  $("#jsonImportBtn").addEventListener("click", () => $("#jsonFile").click());
  $("#excelImportBtn").addEventListener("click", () => $("#excelFile").click());
  $("#excelExportBtn").addEventListener("click", exportExcel);
  $("#coursePdfBtn").addEventListener("click", exportCoursePdfs);
  $("#classPdfBtn").addEventListener("click", exportClassPdfs);
  $("#jsonFile").addEventListener("change", async (event) => {
    try { if (event.target.files[0]) await importJson(event.target.files[0]); }
    catch (error) { showDialog("JSON-Import fehlgeschlagen", error.message); }
    event.target.value = "";
  });
  $("#excelFile").addEventListener("change", async (event) => {
    try { if (event.target.files[0]) await importExcel(event.target.files[0]); }
    catch (error) { showDialog("Excel-Import fehlgeschlagen", error.message); }
    event.target.value = "";
  });
}

bindEvents();
renderAll();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
