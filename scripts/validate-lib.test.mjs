// Failing-fixture tests for the importable validate() core. Each case builds
// in-memory {rfcs, stories} (the loadAll() shape) — exactly what makes
// validate() unit-testable without disk — flips one field into a violating
// state, and asserts the matching error fires (or, for the deliberately-legal
// cases, that none does).
//
// Standalone runner, no framework: collect failures and throw at the end so an
// uncaught exception sets a non-zero exit code. No node:* imports, no process.*
// references — the same purity constraints the validator itself holds to.
import { validate } from "./validate-lib.mjs";

const failures = [];
function test(name, fn) {
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Asserts at least one error mentions `needle`; returns nothing.
function expectError(errors, needle) {
  assert(
    errors.some((e) => e.includes(needle)),
    `expected an error matching "${needle}", got:\n  ${errors.join("\n  ") || "(none)"}`,
  );
}

function expectClean(errors) {
  assert(errors.length === 0, `expected no errors, got:\n  ${errors.join("\n  ")}`);
}

function rfc(overrides = {}, fmOverrides = {}) {
  return {
    dir: "0001-alpha",
    file: "rfcs/0001-alpha/README.md",
    lines: 10,
    body: "",
    frontmatter: {
      rfc: "0001-alpha",
      title: "Alpha",
      status: "active",
      created: new Date("2026-01-01"),
      updated: new Date("2026-01-02"),
      owner: "@owner",
      clusters: ["core"],
      ...fmOverrides,
    },
    ...overrides,
  };
}

function story(overrides = {}, fmOverrides = {}) {
  const id = overrides.id ?? "story-a";
  return {
    id,
    rfc: "0001-alpha",
    file: `rfcs/0001-alpha/stories/${id}.md`,
    lines: 10,
    body: "",
    frontmatter: {
      title: "Story A",
      status: "ready",
      rfc: "0001-alpha",
      cluster: "core",
      deps: [],
      "deps-rfc": [],
      "est-loc": 10,
      priority: null,
      pr: null,
      claim: null,
      assignee: null,
      "blocked-by": null,
      updated: new Date("2026-01-02"),
      ...fmOverrides,
    },
    ...overrides,
  };
}

// ── baseline ──
test("baseline rfc + story validate clean", () => {
  expectClean(validate({ rfcs: [rfc()], stories: [story()] }).errors);
});

// ── status cross-field invariants ──
test("ready with non-null claim is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { claim: "2026-01-01T00:00:00Z" })],
  }).errors;
  expectError(errors, "status: ready must have null claim");
});

test("draft with non-null pr is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "draft", pr: 42 })],
  }).errors;
  expectError(errors, "status: draft must have null pr");
});

test("claimed without claim+assignee is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "claimed" })],
  }).errors;
  expectError(errors, "status: claimed requires a claim timestamp");
  expectError(errors, "status: claimed requires an assignee");
});

test("in-progress without pr is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [
      story(
        {},
        { status: "in-progress", claim: "2026-01-01T00:00:00Z", assignee: "agent", pr: null },
      ),
    ],
  }).errors;
  expectError(errors, "status: in-progress requires a pr");
});

test("blocked without blocked-by is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "blocked", "blocked-by": null })],
  }).errors;
  expectError(errors, "status: blocked requires blocked-by");
});

test("blocked-by on a non-blocked story is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "ready", "blocked-by": "waiting" })],
  }).errors;
  expectError(errors, "only blocked stories carry blocked-by");
});

// ── closed status + closed-reason ──
test("closed without closed-reason is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "closed", "closed-reason": null })],
  }).errors;
  expectError(errors, "status: closed requires closed-reason");
});

test("closed with a closed-reason is legal", () => {
  expectClean(
    validate({
      rfcs: [rfc()],
      stories: [story({}, { status: "closed", "closed-reason": "superseded by 0042" })],
    }).errors,
  );
});

test("closed-reason on a non-closed story is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { status: "ready", "closed-reason": "superseded" })],
  }).errors;
  expectError(errors, "only closed stories carry closed-reason");
});

// ── deliberately-legal cases (match the CLI, don't invent a stricter rule) ──
test("done with null pr is legal", () => {
  expectClean(
    validate({
      rfcs: [rfc()],
      stories: [
        story({}, { status: "done", claim: "2026-01-01T00:00:00Z", assignee: "agent", pr: null }),
      ],
    }).errors,
  );
});

test("ready with un-done deps is legal", () => {
  const dep = story({ id: "dep" }, { status: "draft" });
  const dependent = story({ id: "story-a" }, { deps: ["dep"] });
  expectClean(validate({ rfcs: [rfc()], stories: [dep, dependent] }).errors);
});

// ── RFC closed with non-done story ──
test("closed RFC with an un-done story is rejected", () => {
  const errors = validate({
    rfcs: [rfc({}, { status: "closed" })],
    stories: [story({}, { status: "ready" })],
  }).errors;
  expectError(errors, "status: closed but story");
});

test("closed RFC with all stories done is clean", () => {
  expectClean(
    validate({
      rfcs: [rfc({}, { status: "closed" })],
      stories: [
        story({}, { status: "done", claim: "2026-01-01T00:00:00Z", assignee: "agent", pr: 7 }),
      ],
    }).errors,
  );
});

test("closed RFC with a mix of done and closed stories is clean", () => {
  expectClean(
    validate({
      rfcs: [rfc({}, { status: "closed" })],
      stories: [
        story(
          { id: "shipped" },
          { status: "done", claim: "2026-01-01T00:00:00Z", assignee: "agent", pr: 7 },
        ),
        story({ id: "abandoned" }, { status: "closed", "closed-reason": "superseded" }),
      ],
    }).errors,
  );
});

// ── duplicate numeric prefix ──
test("two RFC dirs sharing a numeric prefix are rejected", () => {
  const a = rfc({ dir: "0007-alpha", file: "rfcs/0007-alpha/README.md" }, { rfc: "0007-alpha" });
  const b = rfc({ dir: "0007-beta", file: "rfcs/0007-beta/README.md" }, { rfc: "0007-beta" });
  const errors = validate({ rfcs: [a, b], stories: [] }).errors;
  expectError(errors, `duplicate RFC numeric prefix "0007"`);
});

test("the allowlisted 0022 prefix pair is not rejected", () => {
  const a = rfc({ dir: "0022-alpha", file: "rfcs/0022-alpha/README.md" }, { rfc: "0022-alpha" });
  const b = rfc({ dir: "0022-beta", file: "rfcs/0022-beta/README.md" }, { rfc: "0022-beta" });
  const errors = validate({ rfcs: [a, b], stories: [] }).errors;
  assert(
    !errors.some((e) => e.includes("duplicate RFC numeric prefix")),
    `0022 is allowlisted but got:\n  ${errors.join("\n  ")}`,
  );
});

// ── created/updated date format ──
test("the literal YYYY-MM-DD placeholder is rejected", () => {
  const errors = validate({
    rfcs: [rfc({}, { created: "YYYY-MM-DD" })],
    stories: [story()],
  }).errors;
  expectError(errors, "created must be a YYYY-MM-DD date");
});

test("a malformed updated string on a story is rejected", () => {
  const errors = validate({
    rfcs: [rfc()],
    stories: [story({}, { updated: "06/13/2026" })],
  }).errors;
  expectError(errors, "updated must be a YYYY-MM-DD date");
});

test("a Date carrying a time-of-day component is rejected", () => {
  const errors = validate({
    rfcs: [rfc({}, { updated: new Date("2026-06-13T10:00:00Z") })],
    stories: [story()],
  }).errors;
  expectError(errors, "updated must be a YYYY-MM-DD date");
});

test("a real Date or YYYY-MM-DD string is accepted", () => {
  expectClean(
    validate({
      rfcs: [rfc({}, { created: new Date("2026-01-01"), updated: "2026-01-02" })],
      stories: [story()],
    }).errors,
  );
});

if (failures.length) {
  throw new Error(`${failures.length} test(s) failed:\n  ${failures.join("\n  ")}`);
}
console.log("validate-lib: all tests passed");
