---
title: "Website VFS generators cannot load module templates"
status: draft
updated: 2026-10-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced by trails#9405 (follow-up to trails#9399).

`packages/website/src/lib/frontiers/vfs-generator.ts`: the Vfs\* generators now construct, but `generate migration` in the browser CLI fails at template load:
`cannot load such file -- /.trails/templates/active-record/migration/migration.ts.tt.js`.
trails#9399 changed generator templates to load as modules; the VFS still serves them as raw text from `TEMPLATES`.

Expected: the VFS (or trailties' template resolution) supplies templates in the form `Generators::Base` now loads, so `runtime`, `app-server` and `sandbox-sw` tests under `src/lib/frontiers` pass again (all red on main).
