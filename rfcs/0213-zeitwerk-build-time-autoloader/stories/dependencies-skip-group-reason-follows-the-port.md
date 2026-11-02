---
title: "Rewrite the Dependencies skip group reason after the port"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/conventions.ts`, the `SKIP_GROUPS` entry for `activesupport/lib/active_support/dependencies.rb`: its `reason` still says there are no path registries and no reloading, though trails#9603 ported `autoload_paths`, `autoload_once_paths`, `_eager_load_paths`, `autoloader` and `eager_load?`.

## Acceptance criteria

- The `reason` describes only the names still skipped.
- `clear` is ported with `trailties-reload-drives-zeitwerk` and leaves the group.
- `docs/ruby-ts-conventions.md` is regenerated.
