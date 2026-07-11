import test from "node:test";
import assert from "node:assert/strict";
import { createSampleData } from "../src/sample-data.js";
import { optimizeEvent, validateEvent } from "../src/optimizer.js";

test("Beispieldaten sind valide und berechenbar", () => {
  const data = createSampleData();
  const validation = validateEvent(data);
  assert.deepEqual(validation.errors, []);
  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  assert.equal(result.participantResults.length, 100);
  assert.equal(result.courseResults.length, 15);
  assert.equal(result.courseResults.filter((course) => course.mode === "Pflicht" && !course.open).length, 0);
  assert.equal(result.courseResults.filter((course) => course.open && course.load < course.effectiveMin).length, 0);
  assert.equal(result.participantResults.filter((person) => person.type === "Nicht zugeteilt").length, 0);
});

test("Pflichtkurs mit unerreichbarer Mindestbelegung wird abgelehnt", () => {
  const data = createSampleData();
  data.workshops[0].min = 500;
  data.workshops[0].max = 500;
  const result = optimizeEvent(data);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test("Optionale Kurse dürfen entfallen", () => {
  const data = createSampleData();
  data.workshops.push({ id: "W99", name: "Zusatzkurs", gradeFrom: 12, gradeTo: 12, schoolForm: "Regional", min: 10, max: 12, mode: "Optional" });
  const result = optimizeEvent(data);
  assert.equal(result.ok, true, result.errors?.join("\n"));
  const course = result.courseResults.find((row) => row.id === "W99");
  assert.equal(course.open, false);
});
