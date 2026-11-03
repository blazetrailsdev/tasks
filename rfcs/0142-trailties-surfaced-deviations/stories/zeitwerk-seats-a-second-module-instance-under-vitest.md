---
title: "Under vitest the autoloader seats a second module instance of every app class"
status: draft
updated: 2026-11-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["zeitwerk", "trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under vitest a test imports `app/models/story.ts` through vite's module graph,
and the boot's Zeitwerk loader imports the same file with Node's own
`import(url.href)` (packages/zeitwerk/src/core-ext/kernel.ts, `require`),
because `@blazetrails/zeitwerk` is an externalized dependency. Two module
instances result: the class the autoloader seats on `TopLevel` is not the class
the test imported. An association that names its target by string (`"Story"`)
resolves to the seated copy, whose schema the test never loaded, and queries
`SELECT FROM "stories"`.

Same root cause as application-cannot-boot-under-vitest-because-initializers-import-natively
(initializers loaded natively). Rails has one loader in `rails test`.

`Loader#imports` already takes thunks (`imports.generated.js`); a thunk created
inside the app's module graph would load through vite. Nothing in trailties or
the app generator hands the generated table to the main loader.

## Found by

trailmap (story trailmap-app-files-define-their-constants). Its barrels used
to re-seat every model and job (`registerModel`, `registerConstant`) from the
test's graph, which hid this; removing them (as RFC 0213 intends) fails 21
tests. Probe: `TopLevel.Story === (await import("app/models/story.ts")).Story`
is false inside a booted vitest file.

## Acceptance

- In a generated application's vitest suite, a constant the autoloader seats
  is the same object the test imports.
- The decision (generated wiring of `imports.generated.js` into
  `Trails.autoloaders.main.imports`, a vitest-side resolver, or another shape)
  is recorded in RFC 0213.
- trailmap can drop its explicit model and job seating.
