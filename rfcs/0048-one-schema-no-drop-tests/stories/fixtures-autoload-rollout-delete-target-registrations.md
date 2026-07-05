---
title: "Roll out autoload opt-in and delete association-target registerModel blocks across converted canonical files"
status: ready
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The canonical-model autoload fallback (PR #4588,
`fixtures-autoload-canonical-model-index`) lets a canonical test file drop
association-target-only `registerModel(...)` lines — the target resolves by name
on first reference via the eager index. Only `collection-proxy.test.ts` was
converted in that PR (dropped `Comment`/`Tagging`/`Tag`/`Owner` + 2 imports).

Other fully-canonical test files still carry manual `registerModel` blocks for
association targets with no fixture set of their own. Each can opt into the
index (`import "../test-helpers/canonical-model-index.js"`) and delete those
lines, per the collision-hazard guidance (only convert files whose same-named
classes are canonical, not bespoke).

## Acceptance criteria

- [ ] Sweep canonical test files whose only remaining `registerModel` calls are
      association-target-only (no bespoke same-named class), opt them into the
      autoload index, and delete those registrations.
- [ ] Each converted file's tests stay green on all lane adapters; no test
      names change; test:compare does not regress.
- [ ] Bespoke/same-named-class files are left alone (documented per file).

## Notes

Best done after the global-install enabler lands
(`fixtures-slice-schema-autoload-safe-for-global-install`) so per-file opt-in
imports aren't needed; until then each file adds the opt-in import. See memory
`project_canonical_autoload_index_must_be_opt_in`.
