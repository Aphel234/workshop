const MODES = new Set(["Pflicht", "Optional"]);
const FORMS = new Set(["Alle", "Regional", "Gymnasial"]);

export function parseGrade(value) {
  const match = String(value ?? "").trim().match(/^(\d{1,2})/);
  return match ? Number(match[1]) : NaN;
}

export function normalizeEvent(input) {
  const settings = {
    allowOutside: false,
    defaultMode: "Pflicht",
    balanceWeight: 1,
    ...(input?.settings ?? {}),
  };

  return {
    name: String(input?.name || "Workshop-Veranstaltung"),
    settings: {
      allowOutside: Boolean(settings.allowOutside),
      defaultMode: MODES.has(settings.defaultMode) ? settings.defaultMode : "Pflicht",
      balanceWeight: Math.max(0, Math.min(100, Number(settings.balanceWeight) || 0)),
    },
    workshops: (input?.workshops ?? []).map((w) => ({
      id: String(w.id ?? "").trim(),
      name: String(w.name ?? "").trim(),
      gradeFrom: Number(w.gradeFrom),
      gradeTo: Number(w.gradeTo),
      schoolForm: FORMS.has(w.schoolForm) ? w.schoolForm : "Alle",
      min: Math.max(0, Number(w.min) || 0),
      max: Math.max(0, Number(w.max) || 0),
      mode: MODES.has(w.mode) ? w.mode : settings.defaultMode,
    })),
    participants: (input?.participants ?? []).map((p) => ({
      id: String(p.id ?? "").trim(),
      firstName: String(p.firstName ?? "").trim(),
      lastName: String(p.lastName ?? "").trim(),
      className: String(p.className ?? "").trim(),
      schoolForm: p.schoolForm === "Gymnasial" ? "Gymnasial" : "Regional",
      wishes: Array.from({ length: 4 }, (_, i) => String(p.wishes?.[i] ?? "").trim()),
      fixed: String(p.fixed ?? "").trim(),
    })),
    locks: (input?.locks ?? []).map((l) => ({
      personId: String(l.personId ?? "").trim(),
      workshopId: String(l.workshopId ?? "").trim(),
      reason: String(l.reason ?? "").trim(),
    })),
  };
}

function effectiveMinimum(course, isOpen = true) {
  if (!isOpen) return 0;
  return Math.max(course.min, course.mode === "Pflicht" ? 1 : 0);
}

function rankIndex(person, courseId) {
  if (person.fixed === courseId) return -1;
  return person.wishes.findIndex((wish) => wish === courseId);
}

export function rankLabel(person, courseId) {
  if (!courseId) return "Nicht zugeteilt";
  if (person.fixed === courseId) return "Feste Setzung";
  const index = rankIndex(person, courseId);
  return ["Erstwunsch", "Zweitwunsch", "Drittwunsch", "Viertwunsch"][index] ?? "Kein Wunsch";
}

function preferenceCost(person, courseId) {
  if (person.fixed === courseId) return 0;
  const index = rankIndex(person, courseId);
  if (index === 0) return 0;
  if (index === 1) return 1_000_000;
  if (index === 2) return 1_010_000;
  if (index === 3) return 1_010_100;
  return 1_010_200;
}

function courseEligible(person, course, lockSet, allowOutside) {
  const grade = parseGrade(person.className);
  if (!Number.isFinite(grade)) return false;
  if (grade < course.gradeFrom || grade > course.gradeTo) return false;
  if (course.schoolForm !== "Alle" && person.schoolForm !== course.schoolForm) return false;
  if (lockSet.has(`${person.id}\u0000${course.id}`)) return false;
  if (person.fixed) return person.fixed === course.id;
  return allowOutside || person.wishes.includes(course.id);
}

export function validateEvent(raw) {
  const event = normalizeEvent(raw);
  const errors = [];
  const warnings = [];
  const courseMap = new Map();
  const personMap = new Map();
  const lockSet = new Set();

  if (event.participants.length > 500) errors.push("Es sind mehr als 500 Teilnehmer eingetragen.");
  if (event.workshops.length > 30) errors.push("Es sind mehr als 30 Workshops eingetragen.");
  if (!event.workshops.length) errors.push("Es ist kein Workshop eingetragen.");
  if (!event.participants.length) errors.push("Es ist kein Teilnehmer eingetragen.");

  event.workshops.forEach((course, index) => {
    const where = `Workshop-Zeile ${index + 1}`;
    if (!course.id) errors.push(`${where}: Workshop-ID fehlt.`);
    if (!course.name) errors.push(`${where}: Workshopname fehlt.`);
    if (courseMap.has(course.id)) errors.push(`${where}: Workshop-ID ${course.id} ist doppelt.`);
    courseMap.set(course.id, course);
    if (!Number.isFinite(course.gradeFrom) || !Number.isFinite(course.gradeTo)) {
      errors.push(`${course.id || where}: Klassenbereich ist ungültig.`);
    } else if (course.gradeFrom > course.gradeTo) {
      errors.push(`${course.id}: „Klasse von“ ist größer als „Klasse bis“.`);
    }
    if (course.max < 1) errors.push(`${course.id}: Maximalbelegung muss mindestens 1 sein.`);
    if (course.min > course.max) errors.push(`${course.id}: Mindestbelegung ist größer als Maximalbelegung.`);
    if (!MODES.has(course.mode)) errors.push(`${course.id}: Durchführung muss Pflicht oder Optional sein.`);
  });

  event.participants.forEach((person, index) => {
    const where = `Teilnehmer-Zeile ${index + 1}`;
    if (!person.id) errors.push(`${where}: Person-ID fehlt.`);
    if (personMap.has(person.id)) errors.push(`${where}: Person-ID ${person.id} ist doppelt.`);
    personMap.set(person.id, person);
    if (!person.firstName || !person.lastName) warnings.push(`${person.id || where}: Vor- oder Nachname fehlt.`);
    if (!Number.isFinite(parseGrade(person.className))) errors.push(`${person.id || where}: Klasse ist ungültig.`);
    person.wishes.filter(Boolean).forEach((wish) => {
      if (!courseMap.has(wish)) warnings.push(`${person.id}: Wunsch ${wish} ist nicht als Workshop vorhanden.`);
    });
    const used = person.wishes.filter(Boolean);
    if (new Set(used).size !== used.length) warnings.push(`${person.id}: Ein Wunsch wurde mehrfach eingetragen.`);
    if (person.fixed && !courseMap.has(person.fixed)) errors.push(`${person.id}: Feste Setzung ${person.fixed} ist unbekannt.`);
  });

  event.locks.forEach((lock, index) => {
    if (!lock.personId && !lock.workshopId) return;
    if (!personMap.has(lock.personId)) warnings.push(`Sperrung ${index + 1}: Person ${lock.personId} ist unbekannt.`);
    if (!courseMap.has(lock.workshopId)) warnings.push(`Sperrung ${index + 1}: Workshop ${lock.workshopId} ist unbekannt.`);
    const key = `${lock.personId}\u0000${lock.workshopId}`;
    if (lockSet.has(key)) warnings.push(`Sperrung ${index + 1}: Kombination ist doppelt.`);
    lockSet.add(key);
  });

  for (const person of event.participants) {
    if (!person.fixed || !courseMap.has(person.fixed)) continue;
    const course = courseMap.get(person.fixed);
    const grade = parseGrade(person.className);
    if (grade < course.gradeFrom || grade > course.gradeTo) {
      errors.push(`${person.id}: Feste Setzung ${course.id} passt nicht zur Klassenstufe.`);
    }
    if (course.schoolForm !== "Alle" && course.schoolForm !== person.schoolForm) {
      errors.push(`${person.id}: Feste Setzung ${course.id} passt nicht zur Schulform.`);
    }
    if (lockSet.has(`${person.id}\u0000${course.id}`)) {
      errors.push(`${person.id}: Feste Setzung ${course.id} ist gleichzeitig gesperrt.`);
    }
  }

  const mandatoryMinimum = event.workshops
    .filter((course) => course.mode === "Pflicht")
    .reduce((sum, course) => sum + effectiveMinimum(course), 0);
  if (mandatoryMinimum > event.participants.length) {
    errors.push(`Die wirksamen Mindestbelegungen der Pflichtkurse (${mandatoryMinimum}) übersteigen die Teilnehmerzahl (${event.participants.length}).`);
  }

  return { event, errors, warnings };
}

class BinaryHeap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= item[0]) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const root = a[0];
    const last = a.pop();
    if (a.length && last) {
      let i = 0;
      while (true) {
        let left = i * 2 + 1;
        if (left >= a.length) break;
        let right = left + 1;
        let child = right < a.length && a[right][0] < a[left][0] ? right : left;
        if (a[child][0] >= last[0]) break;
        a[i] = a[child];
        i = child;
      }
      a[i] = last;
    }
    return root;
  }
  get size() { return this.items.length; }
}

class MinCostMaxFlow {
  constructor(n) {
    this.graph = Array.from({ length: n }, () => []);
  }
  addEdge(from, to, cap, cost, meta = null) {
    const forward = { to, rev: this.graph[to].length, cap, cost, initialCap: cap, meta };
    const reverse = { to: from, rev: this.graph[from].length, cap: 0, cost: -cost, initialCap: 0, meta: null };
    this.graph[from].push(forward);
    this.graph[to].push(reverse);
    return forward;
  }
  run(source, sink, maxFlow) {
    const n = this.graph.length;
    const potential = Array(n).fill(0);
    let flow = 0;
    let cost = 0;

    while (flow < maxFlow) {
      const dist = Array(n).fill(Infinity);
      const prevNode = Array(n).fill(-1);
      const prevEdge = Array(n).fill(-1);
      dist[source] = 0;
      const heap = new BinaryHeap();
      heap.push([0, source]);

      while (heap.size) {
        const [d, node] = heap.pop();
        if (d !== dist[node]) continue;
        const edges = this.graph[node];
        for (let i = 0; i < edges.length; i += 1) {
          const edge = edges[i];
          if (edge.cap <= 0) continue;
          const next = d + edge.cost + potential[node] - potential[edge.to];
          if (next < dist[edge.to]) {
            dist[edge.to] = next;
            prevNode[edge.to] = node;
            prevEdge[edge.to] = i;
            heap.push([next, edge.to]);
          }
        }
      }

      if (!Number.isFinite(dist[sink])) break;
      for (let i = 0; i < n; i += 1) {
        if (Number.isFinite(dist[i])) potential[i] += dist[i];
      }

      let add = maxFlow - flow;
      for (let node = sink; node !== source; node = prevNode[node]) {
        if (node < 0 || prevNode[node] < 0) { add = 0; break; }
        add = Math.min(add, this.graph[prevNode[node]][prevEdge[node]].cap);
      }
      if (add <= 0) break;

      for (let node = sink; node !== source; node = prevNode[node]) {
        const edge = this.graph[prevNode[node]][prevEdge[node]];
        edge.cap -= add;
        this.graph[node][edge.rev].cap += add;
        cost += add * edge.cost;
      }
      flow += add;
    }

    return { flow, cost };
  }
}

class Dinic {
  constructor(n) { this.g = Array.from({ length: n }, () => []); }
  addEdge(from, to, cap) {
    const f = { to, rev: this.g[to].length, cap };
    const r = { to: from, rev: this.g[from].length, cap: 0 };
    this.g[from].push(f); this.g[to].push(r);
  }
  maxFlow(source, sink) {
    let total = 0;
    const n = this.g.length;
    while (true) {
      const level = Array(n).fill(-1);
      level[source] = 0;
      const queue = [source];
      for (let q = 0; q < queue.length; q += 1) {
        const v = queue[q];
        for (const e of this.g[v]) if (e.cap > 0 && level[e.to] < 0) {
          level[e.to] = level[v] + 1; queue.push(e.to);
        }
      }
      if (level[sink] < 0) return total;
      const it = Array(n).fill(0);
      const dfs = (v, pushed) => {
        if (v === sink) return pushed;
        for (; it[v] < this.g[v].length; it[v] += 1) {
          const e = this.g[v][it[v]];
          if (e.cap <= 0 || level[e.to] !== level[v] + 1) continue;
          const sent = dfs(e.to, Math.min(pushed, e.cap));
          if (sent > 0) { e.cap -= sent; this.g[e.to][e.rev].cap += sent; return sent; }
        }
        return 0;
      };
      while (true) {
        const sent = dfs(source, Number.MAX_SAFE_INTEGER);
        if (!sent) break;
        total += sent;
      }
    }
  }
}

function fixedLoads(event, courseMap) {
  const loads = new Map([...courseMap.keys()].map((id) => [id, 0]));
  for (const person of event.participants) if (person.fixed && loads.has(person.fixed)) {
    loads.set(person.fixed, loads.get(person.fixed) + 1);
  }
  return loads;
}

function canMeetMinimums(event, openSet, lockSet, courseMap) {
  const fixed = fixedLoads(event, courseMap);
  for (const [courseId, load] of fixed) {
    if (load > 0 && !openSet.has(courseId)) return false;
    if (load > (courseMap.get(courseId)?.max ?? 0)) return false;
  }

  const courses = [...openSet].map((id) => courseMap.get(id)).filter(Boolean);
  const nonFixed = event.participants.filter((p) => !p.fixed);
  const source = 0;
  const courseStart = 1;
  const personStart = courseStart + courses.length;
  const sink = personStart + nonFixed.length;
  const dinic = new Dinic(sink + 1);
  let requiredTotal = 0;

  courses.forEach((course, ci) => {
    const requirement = Math.max(0, effectiveMinimum(course) - (fixed.get(course.id) || 0));
    if (requirement > course.max - (fixed.get(course.id) || 0)) return false;
    requiredTotal += requirement;
    dinic.addEdge(source, courseStart + ci, requirement);
    nonFixed.forEach((person, pi) => {
      if (courseEligible(person, course, lockSet, event.settings.allowOutside)) {
        dinic.addEdge(courseStart + ci, personStart + pi, 1);
      }
    });
  });
  nonFixed.forEach((_, pi) => dinic.addEdge(personStart + pi, sink, 1));
  return dinic.maxFlow(source, sink) === requiredTotal;
}

function determineOpenCourses(event, lockSet, courseMap) {
  const open = new Set(event.workshops.filter((c) => c.mode === "Pflicht").map((c) => c.id));
  for (const person of event.participants) if (person.fixed) open.add(person.fixed);

  if (!canMeetMinimums(event, open, lockSet, courseMap)) {
    throw new Error("Die Mindestbelegungen der Pflichtkurse können nicht gleichzeitig erfüllt werden. Prüfe Wünsche, Sperrungen, Klassenstufen und Schulformen.");
  }

  const optional = event.workshops
    .filter((course) => course.mode === "Optional" && !open.has(course.id))
    .map((course) => {
      let score = 0;
      let candidates = 0;
      for (const person of event.participants) {
        if (!courseEligible(person, course, lockSet, event.settings.allowOutside)) continue;
        candidates += 1;
        const idx = rankIndex(person, course.id);
        score += [100, 30, 10, 3][idx] ?? (event.settings.allowOutside ? 1 : 0);
      }
      return { course, score, candidates };
    })
    .filter(({ course, candidates }) => candidates >= Math.max(course.min, 1))
    .sort((a, b) => b.score - a.score || a.course.id.localeCompare(b.course.id, "de"));

  for (const { course } of optional) {
    const trial = new Set(open);
    trial.add(course.id);
    if (canMeetMinimums(event, trial, lockSet, courseMap)) open.add(course.id);
  }
  return open;
}

function calculateTargets(event, openSet, courseMap, fixed) {
  const targets = new Map();
  const openCourses = [...openSet].map((id) => courseMap.get(id)).filter(Boolean);
  let baseTotal = 0;
  let maxTotal = 0;
  for (const course of openCourses) {
    const base = Math.max(effectiveMinimum(course), fixed.get(course.id) || 0);
    targets.set(course.id, Math.min(base, course.max));
    baseTotal += Math.min(base, course.max);
    maxTotal += course.max;
  }
  if (baseTotal > event.participants.length) throw new Error("Die Mindestbelegungen übersteigen die Teilnehmerzahl.");
  let remaining = Math.min(event.participants.length, maxTotal) - baseTotal;
  while (remaining > 0) {
    const candidates = openCourses
      .filter((course) => targets.get(course.id) < course.max)
      .sort((a, b) => targets.get(a.id) - targets.get(b.id) || a.max - b.max || a.id.localeCompare(b.id, "de"));
    if (!candidates.length) break;
    targets.set(candidates[0].id, targets.get(candidates[0].id) + 1);
    remaining -= 1;
  }
  return targets;
}

function assignMinimums(event, openSet, lockSet, courseMap, assignments, loads) {
  const nonFixed = event.participants.filter((person) => !assignments.has(person.id));
  const courses = [...openSet].map((id) => courseMap.get(id)).filter(Boolean);
  const source = 0;
  const courseStart = 1;
  const personStart = courseStart + courses.length;
  const sink = personStart + nonFixed.length;
  const flow = new MinCostMaxFlow(sink + 1);
  const assignmentEdges = [];
  let requiredTotal = 0;

  courses.forEach((course, ci) => {
    const required = Math.max(0, effectiveMinimum(course) - (loads.get(course.id) || 0));
    requiredTotal += required;
    flow.addEdge(source, courseStart + ci, required, 0);
    nonFixed.forEach((person, pi) => {
      if (!courseEligible(person, course, lockSet, event.settings.allowOutside)) return;
      const edge = flow.addEdge(courseStart + ci, personStart + pi, 1, preferenceCost(person, course.id), {
        personId: person.id,
        courseId: course.id,
      });
      assignmentEdges.push(edge);
    });
  });
  nonFixed.forEach((_, pi) => flow.addEdge(personStart + pi, sink, 1, 0));

  const result = flow.run(source, sink, requiredTotal);
  if (result.flow !== requiredTotal) throw new Error("Die Mindestbelegungen konnten nicht erfüllt werden.");
  for (const edge of assignmentEdges) {
    if (edge.initialCap === 1 && edge.cap === 0) {
      assignments.set(edge.meta.personId, edge.meta.courseId);
      loads.set(edge.meta.courseId, (loads.get(edge.meta.courseId) || 0) + 1);
    }
  }
}

function assignRemaining(event, openSet, lockSet, courseMap, assignments, loads, targets) {
  const remainingPeople = event.participants.filter((person) => !assignments.has(person.id));
  const courses = [...openSet].map((id) => courseMap.get(id)).filter(Boolean);
  const source = 0;
  const personStart = 1;
  const courseStart = personStart + remainingPeople.length;
  const sink = courseStart + courses.length;
  const flow = new MinCostMaxFlow(sink + 1);
  const assignmentEdges = [];
  const unassignedEdges = [];

  remainingPeople.forEach((person, pi) => {
    const personNode = personStart + pi;
    flow.addEdge(source, personNode, 1, 0);
    courses.forEach((course, ci) => {
      if (!courseEligible(person, course, lockSet, event.settings.allowOutside)) return;
      if ((loads.get(course.id) || 0) >= course.max) return;
      const edge = flow.addEdge(personNode, courseStart + ci, 1, preferenceCost(person, course.id), {
        personId: person.id,
        courseId: course.id,
      });
      assignmentEdges.push(edge);
    });
    const edge = flow.addEdge(personNode, sink, 1, 1_000_000_000, { personId: person.id });
    unassignedEdges.push(edge);
  });

  courses.forEach((course, ci) => {
    const current = loads.get(course.id) || 0;
    const available = Math.max(0, course.max - current);
    for (let seat = 1; seat <= available; seat += 1) {
      const resultingLoad = current + seat;
      const penalty = Math.round(event.settings.balanceWeight * Math.abs(resultingLoad - (targets.get(course.id) || 0)));
      flow.addEdge(courseStart + ci, sink, 1, penalty);
    }
  });

  const result = flow.run(source, sink, remainingPeople.length);
  if (result.flow !== remainingPeople.length) throw new Error("Die restlichen Teilnehmer konnten nicht verarbeitet werden.");
  for (const edge of assignmentEdges) {
    if (edge.initialCap === 1 && edge.cap === 0) {
      assignments.set(edge.meta.personId, edge.meta.courseId);
      loads.set(edge.meta.courseId, (loads.get(edge.meta.courseId) || 0) + 1);
    }
  }
  for (const edge of unassignedEdges) {
    if (edge.initialCap === 1 && edge.cap === 0 && !assignments.has(edge.meta.personId)) {
      assignments.set(edge.meta.personId, "");
    }
  }
}

export function optimizeEvent(raw) {
  const { event, errors, warnings } = validateEvent(raw);
  if (errors.length) return { ok: false, errors, warnings };

  try {
    const courseMap = new Map(event.workshops.map((course) => [course.id, course]));
    const personMap = new Map(event.participants.map((person) => [person.id, person]));
    const lockSet = new Set(event.locks.filter((l) => l.personId && l.workshopId).map((l) => `${l.personId}\u0000${l.workshopId}`));
    const openSet = determineOpenCourses(event, lockSet, courseMap);
    const assignments = new Map();
    const loads = new Map(event.workshops.map((course) => [course.id, 0]));

    for (const person of event.participants) {
      if (person.fixed) {
        assignments.set(person.id, person.fixed);
        loads.set(person.fixed, (loads.get(person.fixed) || 0) + 1);
      }
    }

    const fixed = fixedLoads(event, courseMap);
    const targets = calculateTargets(event, openSet, courseMap, fixed);
    assignMinimums(event, openSet, lockSet, courseMap, assignments, loads);
    assignRemaining(event, openSet, lockSet, courseMap, assignments, loads, targets);

    const participantResults = event.participants.map((person) => {
      const courseId = assignments.get(person.id) || "";
      const course = courseId ? courseMap.get(courseId) : null;
      const type = rankLabel(person, courseId);
      return {
        personId: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        className: person.className,
        schoolForm: person.schoolForm,
        workshopId: courseId,
        workshopName: course?.name || "",
        type,
        note: type === "Nicht zugeteilt" ? "Kapazitäten oder Zugangsregeln prüfen" : type === "Kein Wunsch" ? "Außerhalb der vier Wünsche" : "",
      };
    });

    const courseResults = event.workshops.map((course) => {
      const open = openSet.has(course.id);
      const load = loads.get(course.id) || 0;
      const target = open ? targets.get(course.id) || 0 : 0;
      const min = open ? effectiveMinimum(course) : 0;
      return {
        ...course,
        open,
        effectiveMin: min,
        target,
        load,
        deviation: open ? load - target : 0,
        status: open ? "Findet statt" : "Entfällt (optional)",
      };
    });

    const counts = new Map();
    for (const result of participantResults) counts.set(result.type, (counts.get(result.type) || 0) + 1);
    const openCourses = courseResults.filter((course) => course.open);
    const meanDeviation = openCourses.length
      ? openCourses.reduce((sum, course) => sum + Math.abs(course.deviation), 0) / openCourses.length
      : 0;

    return {
      ok: true,
      event,
      warnings,
      participantResults,
      courseResults,
      stats: {
        participants: event.participants.length,
        workshops: event.workshops.length,
        openCourses: openCourses.length,
        first: counts.get("Erstwunsch") || 0,
        second: counts.get("Zweitwunsch") || 0,
        third: counts.get("Drittwunsch") || 0,
        fourth: counts.get("Viertwunsch") || 0,
        fixed: counts.get("Feste Setzung") || 0,
        outside: counts.get("Kein Wunsch") || 0,
        unassigned: counts.get("Nicht zugeteilt") || 0,
        meanDeviation,
      },
      personMap,
      courseMap,
    };
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)], warnings };
  }
}
