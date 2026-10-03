---
title: "trailmap: vendor-trails.sh leaves a newly required @blazetrails package to be added by hand"
status: draft
updated: 2026-10-03
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#30. The bump to trails `9e17ddc98d` needed `@blazetrails/ruby-compat` as a
direct dependency (the fs, path, process and child-process adapters moved there).
`scripts/vendor-trails.sh` packed its tarball and regenerated the overrides block in
`pnpm-workspace.yaml`, but the `package.json` dependency was added by hand, and nothing reported
that application code imported a package it did not declare until the typecheck failed.

The same script edits `pnpm-workspace.yaml` by pattern, not through a YAML parser (none is a
dependency). #30 made it refuse a file whose `@blazetrails/` override lines are not one contiguous
block; it still cannot handle a reformatted file.

## Acceptance criteria

- [ ] After `scripts/vendor-trails.sh`, every `@blazetrails/*` package imported under `app/`, `config/`, `lib/`, `scripts/` or `test/` is a declared dependency, or the script fails naming the missing one.
- [ ] Decide whether the overrides block is written through a YAML parser or stays pattern-based with the guard, and record why in the script.
