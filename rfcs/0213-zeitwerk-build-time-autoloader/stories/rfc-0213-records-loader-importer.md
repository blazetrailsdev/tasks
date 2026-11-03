---
title: "RFC 0213 records Loader#importer and why the generated imports table is not used under vitest"
status: claimed
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: ["zeitwerk"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-03T22:48:22Z"
assignee: "generated-app-vitest-suite-runs-against-packed-packages"
blocked-by: null
closed-reason: null
---

## Context

zeitwerk-seats-a-second-module-instance-under-vitest (trails#9683) added
`Loader#importer`, set by `trails new`'s config/environment.ts to
`(url) => import(url)`, and chose it over wiring `imports.generated.js` (which
goes stale when a file is added after `trails build`). Its acceptance said the
decision is recorded in RFC 0213; it was recorded only in trails' CLAUDE.md
(after "the walk's result can be built ahead of time").

## Expected

RFC 0213's README states, next to "Loading: everything at boot": an
application hands the loader its own `import()` through `Loader#importer` so a
host with its own module graph (vitest) seats the classes it imports; why the
generated imports table is not used for this; and that the URL carries the
reload generation.
