import test from "node:test";
import assert from "node:assert/strict";
import { createSampleData } from "../src/sample-data.js";
import { optimizeEvent, validateEvent } from "../src/optimizer.js";

test("Beispieldaten sind valide, berechenbar und enthalten zwei Drachenboot-Durchführungen", () => {
  const data = createSampleData();
  const validation = validateEvent(data);
  assert.deepEqual(validation.errors, []);
  assert.equal(new Set(data.workshops.map((w) => w.offerId)).size, 15);
  assert.equal(data.workshops.filter((w) => w.offerId === "W10").length, 2);

  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  assert.equal(result.participantResults.length, 100);
  assert.equal(result.courseResults.length, 16);
  assert.equal(result.courseResults.filter((course) => course.mode === "Pflicht" && !course.open).length, 0);
  assert.equal(result.courseResults.filter((course) => course.open && course.load < course.effectiveMin).length, 0);
  assert.equal(result.participantResults.filter((person) => person.type === "Nicht zugeteilt").length, 0);

  for (const course of result.courseResults.filter((c) => c.cohortMinEffective > 0)) {
    assert.ok(course.cohorts.every((cohort) => cohort.count >= course.cohortMinEffective));
  }
});

test("Zwei Durchführungen derselben Kursart zählen beide als derselbe Erstwunsch", () => {
  const data = {
    name: "Doppelter Kurs",
    settings: { allowOutside: false, defaultMode: "Pflicht", balanceWeight: 1, cohortMin: 2 },
    workshops: [
      { id: "D-A", offerId: "D", name: "Drachenboot", session: "A", gradeFrom: 7, gradeTo: 12, schoolForm: "Alle", min: 2, max: 4, mode: "Pflicht", cohortMin: null },
      { id: "D-B", offerId: "D", name: "Drachenboot", session: "B", gradeFrom: 7, gradeTo: 12, schoolForm: "Alle", min: 2, max: 4, mode: "Pflicht", cohortMin: null },
    ],
    participants: Array.from({ length: 4 }, (_, i) => ({ id: `P${i + 1}`, firstName: `V${i + 1}`, lastName: `N${i + 1}`, className: "9a", schoolForm: "Regional", wishes: ["D", "", "", ""], fixed: "" })),
    locks: [],
  };
  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  assert.deepEqual(result.courseResults.map((c) => c.load).sort(), [2, 2]);
  assert.ok(result.participantResults.every((p) => p.type === "Erstwunsch"));
});

test("Kohortenminimum Jahrgang plus Bildungsgang wird eingehalten", () => {
  const data = {
    name: "Kohorte",
    settings: { allowOutside: false, defaultMode: "Pflicht", balanceWeight: 1, cohortMin: 3 },
    workshops: [{ id: "A", offerId: "A", name: "Kurs A", session: "A", gradeFrom: 7, gradeTo: 12, schoolForm: "Alle", min: 3, max: 6, mode: "Pflicht", cohortMin: null }],
    participants: Array.from({ length: 3 }, (_, i) => ({ id: `P${i}`, firstName: "A", lastName: String(i), className: "8a", schoolForm: "Gymnasial", wishes: ["A", "", "", ""], fixed: "" })),
    locks: [],
  };
  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  assert.equal(result.courseResults[0].cohorts[0].count, 3);
});

test("Nicht erfüllbares Kohortenminimum wird mit Fehler abgelehnt", () => {
  const data = {
    name: "Kohorte unmöglich",
    settings: { allowOutside: false, defaultMode: "Pflicht", balanceWeight: 1, cohortMin: 3 },
    workshops: [{ id: "A", offerId: "A", name: "Kurs A", session: "A", gradeFrom: 7, gradeTo: 12, schoolForm: "Alle", min: 1, max: 5, mode: "Pflicht", cohortMin: null }],
    participants: [
      { id: "P1", firstName: "A", lastName: "1", className: "8a", schoolForm: "Gymnasial", wishes: ["A", "", "", ""], fixed: "" },
      { id: "P2", firstName: "A", lastName: "2", className: "9a", schoolForm: "Regional", wishes: ["A", "", "", ""], fixed: "" },
    ],
    locks: [],
  };
  const result = optimizeEvent(data);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => message.includes("Kohortenregel") || message.includes("erforderlich")));
});

test("Pflichtkurs mit unerreichbarer Mindestbelegung wird abgelehnt", () => {
  const data = createSampleData();
  data.workshops[0].min = 500;
  data.workshops[0].max = 500;
  const result = optimizeEvent(data);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test("Optionale Durchführungen dürfen entfallen", () => {
  const data = createSampleData();
  data.workshops.push({ id: "W99", offerId: "W99", name: "Zusatzkurs", session: "A", gradeFrom: 12, gradeTo: 12, schoolForm: "Regional", min: 10, max: 12, mode: "Optional", cohortMin: 0 });
  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  const course = result.courseResults.find((row) => row.id === "W99");
  assert.equal(course.open, false);
});

test('Bevorzugte Klassenregel blockiert die Lösung nicht', () => {
  const event = {
    name: 'Soft rule',
    settings: { allowOutside: false, balanceWeight: 10, balanceThreshold: 10, cohortMin: 0,
      rules: [{ id: 'R1', type: 'class', min: 3, mode: 'preferred', enabled: true }] },
    workshops: [
      { id: 'W1', offerId: 'K1', name: 'A', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 10, mode: 'Pflicht', cohortMin: null },
      { id: 'W2', offerId: 'K2', name: 'B', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 10, mode: 'Pflicht', cohortMin: null },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: 'A', className: '7a', schoolForm: 'Regional', wishes: ['K1','K2','',''], fixed: '' },
      { id: 'P2', firstName: 'B', lastName: 'B', className: '8a', schoolForm: 'Regional', wishes: ['K1','K2','',''], fixed: '' },
      { id: 'P3', firstName: 'C', lastName: 'C', className: '9a', schoolForm: 'Regional', wishes: ['K2','K1','',''], fixed: '' },
      { id: 'P4', firstName: 'D', lastName: 'D', className: '10a', schoolForm: 'Regional', wishes: ['K2','K1','',''], fixed: '' },
    ], locks: []
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, true);
  assert.ok(result.stats.preferredRuleViolations >= 0);
});

test('Harte Jahrgangsregel wird entweder erfüllt oder mit Fehler abgelehnt', () => {
  const event = {
    name: 'Hard rule',
    settings: { allowOutside: false, balanceWeight: 10, balanceThreshold: 10, cohortMin: 0,
      rules: [{ id: 'R1', type: 'grade', min: 2, mode: 'hard', enabled: true }] },
    workshops: [
      { id: 'W1', offerId: 'K1', name: 'A', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 10, mode: 'Pflicht', cohortMin: null },
      { id: 'W2', offerId: 'K2', name: 'B', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 10, mode: 'Pflicht', cohortMin: null },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: 'A', className: '7a', schoolForm: 'Regional', wishes: ['K1','K2','',''], fixed: '' },
      { id: 'P2', firstName: 'B', lastName: 'B', className: '7b', schoolForm: 'Gymnasial', wishes: ['K2','K1','',''], fixed: '' },
      { id: 'P3', firstName: 'C', lastName: 'C', className: '8a', schoolForm: 'Regional', wishes: ['K1','K2','',''], fixed: '' },
      { id: 'P4', firstName: 'D', lastName: 'D', className: '8b', schoolForm: 'Gymnasial', wishes: ['K2','K1','',''], fixed: '' },
    ], locks: []
  };
  const result = optimizeEvent(event);
  if (result.ok) assert.equal(result.stats.hardRuleViolations, 0);
  else assert.match(result.errors.join(' '), /harte Regel/i);
});

test('Berechnungsqualität führt die erwartete Zahl Varianten aus', () => {
  const data = createSampleData();
  data.settings.qualityMode = 'fast';
  const fast = optimizeEvent(data);
  assert.equal(fast.ok, true);
  assert.equal(fast.quality.runsTried, 1);

  data.settings.qualityMode = 'standard';
  const standard = optimizeEvent(data);
  assert.equal(standard.ok, true);
  assert.equal(standard.quality.runsTried, 6);
  assert.ok(standard.stats.first >= fast.stats.first);

  data.settings.qualityMode = 'thorough';
  const thorough = optimizeEvent(data);
  assert.equal(thorough.ok, true);
  assert.equal(thorough.quality.runsTried, 24);
  assert.ok(thorough.stats.first >= fast.stats.first);
});

test('Viertwunsch wird vermieden, wenn eine Lösung mit Drittwunsch möglich ist', () => {
  const event = {
    name: 'Wunschpriorität',
    settings: { allowOutside: false, defaultMode: 'Pflicht', balanceWeight: 10, balanceThreshold: 10, cohortMin: 0, qualityMode: 'standard', rules: [] },
    workshops: [
      { id: 'A', offerId: 'A', name: 'A', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 1, mode: 'Pflicht', cohortMin: 0 },
      { id: 'B', offerId: 'B', name: 'B', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 1, mode: 'Pflicht', cohortMin: 0 },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: 'A', className: '9a', schoolForm: 'Regional', wishes: ['A', 'X', 'Y', 'B'], fixed: '' },
      { id: 'P2', firstName: 'B', lastName: 'B', className: '9a', schoolForm: 'Regional', wishes: ['Z', 'A', 'B', ''], fixed: '' },
    ],
    locks: [],
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, true, result.errors?.join('\n'));
  assert.equal(result.stats.fourth, 0);
  assert.equal(result.stats.third, 1);
});

test('Kleine Kurse erhalten bis zur Ausgleichsschwelle ihre Maximalgröße als Ziel', () => {
  const event = {
    name: 'Kleine Kurse',
    settings: { allowOutside: false, defaultMode: 'Pflicht', balanceWeight: 10, balanceThreshold: 5, cohortMin: 0, qualityMode: 'fast', rules: [] },
    workshops: [
      { id: 'S', offerId: 'S', name: 'Klein', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 5, mode: 'Pflicht', cohortMin: 0 },
      { id: 'L1', offerId: 'L1', name: 'Groß 1', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 20, mode: 'Pflicht', cohortMin: 0 },
      { id: 'L2', offerId: 'L2', name: 'Groß 2', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 0, max: 20, mode: 'Pflicht', cohortMin: 0 },
    ],
    participants: Array.from({ length: 9 }, (_, i) => ({
      id: `P${i + 1}`, firstName: 'T', lastName: String(i + 1), className: '9a', schoolForm: 'Regional',
      wishes: ['S', 'L1', 'L2', ''], fixed: '',
    })),
    locks: [],
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, true, result.errors?.join('\n'));
  const targets = Object.fromEntries(result.courseResults.map((course) => [course.id, course.target]));
  assert.equal(targets.S, 5);
  assert.equal(targets.L1 + targets.L2, 4);
  assert.ok(targets.L1 <= 2 && targets.L2 <= 2);
});

test('Mehrere gleichzeitige harte Jahrgangsverletzungen werden nacheinander repariert', () => {
  const event = {
    name: 'Harte Regeln reparierbar',
    settings: {
      allowOutside: false,
      defaultMode: 'Pflicht',
      balanceWeight: 0,
      balanceThreshold: 10,
      cohortMin: 0,
      qualityMode: 'fast',
      rules: [{ id: 'R1', type: 'grade', min: 2, mode: 'hard', enabled: true }],
    },
    workshops: [
      { id: 'A', offerId: 'A', name: 'Kurs A', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 4, mode: 'Pflicht', cohortMin: 0 },
      { id: 'B', offerId: 'B', name: 'Kurs B', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 3, mode: 'Pflicht', cohortMin: 0 },
      { id: 'C', offerId: 'C', name: 'Kurs C', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 3, mode: 'Pflicht', cohortMin: 0 },
    ],
    participants: [
      { id: 'A11', firstName: 'A', lastName: '11', className: '11a', schoolForm: 'Regional', wishes: ['A','B','',''], fixed: '' },
      { id: 'A10', firstName: 'A', lastName: '10', className: '10a', schoolForm: 'Regional', wishes: ['A','C','',''], fixed: '' },
      { id: 'B11-1', firstName: 'B', lastName: '1', className: '11b', schoolForm: 'Regional', wishes: ['B','A','',''], fixed: '' },
      { id: 'B11-2', firstName: 'B', lastName: '2', className: '11b', schoolForm: 'Regional', wishes: ['B','A','',''], fixed: '' },
      { id: 'B11-3', firstName: 'B', lastName: '3', className: '11b', schoolForm: 'Regional', wishes: ['B','A','',''], fixed: '' },
      { id: 'C10-1', firstName: 'C', lastName: '1', className: '10b', schoolForm: 'Regional', wishes: ['C','A','',''], fixed: '' },
      { id: 'C10-2', firstName: 'C', lastName: '2', className: '10b', schoolForm: 'Regional', wishes: ['C','A','',''], fixed: '' },
      { id: 'C10-3', firstName: 'C', lastName: '3', className: '10b', schoolForm: 'Regional', wishes: ['C','A','',''], fixed: '' },
    ],
    locks: [],
  };

  const result = optimizeEvent(event);
  assert.equal(result.ok, true, result.errors?.join('\n'));
  assert.equal(result.stats.hardRuleViolations, 0);
  const courseA = result.courseResults.find((course) => course.id === 'A');
  assert.equal(courseA.load, 4);
  assert.equal(courseA.ruleHardViolations, 0);
});

test('Kursbezogene Jahrgangs-Minima und -Maxima werden hart eingehalten', () => {
  const event = {
    name: 'Jahrgangsgrenzen',
    settings: { allowOutside: false, defaultMode: 'Pflicht', balanceWeight: 10, balanceThreshold: 10, cohortMin: 0, qualityMode: 'standard', rules: [] },
    workshops: [
      { id: 'A', offerId: 'A', name: 'Kurs A', session: '', gradeFrom: 7, gradeTo: 10, schoolForm: 'Alle', min: 4, max: 6, mode: 'Pflicht', cohortMin: 0,
        gradeLimits: { '8': { min: 3, max: 3 }, '9': { min: null, max: 1 } } },
      { id: 'B', offerId: 'B', name: 'Kurs B', session: '', gradeFrom: 7, gradeTo: 10, schoolForm: 'Alle', min: 2, max: 8, mode: 'Pflicht', cohortMin: 0, gradeLimits: {} },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: '1', className: '8aG', schoolForm: 'Gymnasial', wishes: ['B','A','',''], fixed: '' },
      { id: 'P2', firstName: 'A', lastName: '2', className: '8bR', schoolForm: 'Regional', wishes: ['B','A','',''], fixed: '' },
      { id: 'P3', firstName: 'A', lastName: '3', className: '8cG', schoolForm: 'Gymnasial', wishes: ['A','B','',''], fixed: '' },
      { id: 'P4', firstName: 'B', lastName: '4', className: '9aG', schoolForm: 'Gymnasial', wishes: ['A','B','',''], fixed: '' },
      { id: 'P5', firstName: 'B', lastName: '5', className: '9bR', schoolForm: 'Regional', wishes: ['A','B','',''], fixed: '' },
      { id: 'P6', firstName: 'C', lastName: '6', className: '10aG', schoolForm: 'Gymnasial', wishes: ['A','B','',''], fixed: '' },
      { id: 'P7', firstName: 'C', lastName: '7', className: '10bR', schoolForm: 'Regional', wishes: ['B','A','',''], fixed: '' },
      { id: 'P8', firstName: 'C', lastName: '8', className: '7aG', schoolForm: 'Gymnasial', wishes: ['B','A','',''], fixed: '' },
    ], locks: []
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, true, result.errors?.join('\n'));
  const assignedA = result.participantResults.filter((row) => row.workshopId === 'A');
  const countGrade = (grade) => assignedA.filter((row) => String(row.className).startsWith(String(grade))).length;
  assert.equal(countGrade(8), 3);
  assert.ok(countGrade(9) <= 1);
  const courseA = result.courseResults.find((course) => course.id === 'A');
  assert.deepEqual(courseA.gradeLimitSummary.map((x) => [x.grade, x.min, x.max, x.count]), [[8,3,3,3],[9,null,1,countGrade(9)]]);
});

test('Leere Jahrgangsgrenzen erzeugen keine zusätzliche Vorgabe', () => {
  const event = {
    name: 'Leere Jahrgangsgrenzen',
    settings: { allowOutside: false, defaultMode: 'Pflicht', balanceWeight: 0, balanceThreshold: 10, cohortMin: 0, qualityMode: 'fast', rules: [] },
    workshops: [
      { id: 'A', offerId: 'A', name: 'A', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 4, mode: 'Pflicht', cohortMin: 0, gradeLimits: { '8': { min: '', max: '' } } },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: '1', className: '9aR', schoolForm: 'Regional', wishes: ['A','','',''], fixed: '' },
    ], locks: []
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, true, result.errors?.join('\n'));
  assert.deepEqual(result.event.workshops[0].gradeLimits, {});
});

test('Nicht erfüllbares hartes Jahrgangsminimum liefert eine verständliche Fehlermeldung', () => {
  const event = {
    name: 'Jahrgangsminimum unmöglich',
    settings: { allowOutside: false, defaultMode: 'Pflicht', balanceWeight: 0, balanceThreshold: 10, cohortMin: 0, qualityMode: 'fast', rules: [] },
    workshops: [
      { id: 'A', offerId: 'A', name: 'Drachenboot', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 5, mode: 'Pflicht', cohortMin: 0, gradeLimits: { '8': { min: 2, max: null } } },
      { id: 'B', offerId: 'B', name: 'Andere', session: '', gradeFrom: 7, gradeTo: 12, schoolForm: 'Alle', min: 1, max: 5, mode: 'Pflicht', cohortMin: 0, gradeLimits: {} },
    ],
    participants: [
      { id: 'P1', firstName: 'A', lastName: '1', className: '8aG', schoolForm: 'Gymnasial', wishes: ['A','','',''], fixed: '' },
      { id: 'P2', firstName: 'B', lastName: '2', className: '9aR', schoolForm: 'Regional', wishes: ['B','','',''], fixed: '' },
      { id: 'P3', firstName: 'C', lastName: '3', className: '10aG', schoolForm: 'Gymnasial', wishes: ['B','','',''], fixed: '' },
    ], locks: []
  };
  const result = optimizeEvent(event);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Jahrgang 8.*mindestens 2/i);
});
