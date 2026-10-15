---
title: "ruby-compat dist/file.js, io.js, yaml-tree.js throw classpaths TDZ as entry modules"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Importing the built `packages/ruby-compat/dist/file.js`, `dist/io.js` or `dist/psych/visitors/yaml-tree.js` as an entry module in plain node throws `ReferenceError: Cannot access 'classpaths' before initialization` (reproduced on origin/main at 4fb2cc70ff, found during trails#8918). `dist/index.js`, `dist/psych.js` and `dist/yaml.js` load. CLAUDE.md § "Call-time constant resolution" requires both directions to load from built dist; vitest masks the TDZ.

Repro: `pnpm --filter @blazetrails/ruby-compat build && cd packages/ruby-compat && node -e "import('./dist/file.js')"`.

## Acceptance criteria

- [ ] Find the cycle reaching `classpaths` (in `variable.ts`) and break it with a sanctioned shape (namespace seat / call-time read), not a reordered import.
- [ ] Each of `dist/file.js`, `dist/io.js`, `dist/psych/visitors/yaml-tree.js` imports cleanly in plain node; add the check to an existing dist-import test if one exists.
