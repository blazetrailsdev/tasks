---
title: "Canonical Parrot virtual attr + model registry"
status: ready
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 43
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `attribute :cancel_save_from_callback` on
the canonical `Parrot` must be `{ virtual: true }` (no `parrots` column); plus
models need registering when no fixtures are loaded so `belongsTo("parrot")`
resolves.

## Acceptance criteria

- [ ] Parrot `cancel_save_from_callback` declared `{ virtual: true }`.
- [ ] Models register (so `belongsTo("parrot")` resolves) without loaded fixtures.
- [ ] Un-skips: `association assignment changes foreign key` (1).

## Notes

Prereq for [dirty-enum-from-to-casting](dirty-enum-from-to-casting.md).
