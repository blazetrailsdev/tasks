---
title: "Credit the Object.hasOwn fetch form on a member receiver, drop Variation#format's receipt"
status: in-progress
updated: 2026-11-02
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9636
claim: "2026-11-02T18:21:42Z"
assignee: "zeitwerk-check-name-error-reaches-task-abort"
blocked-by: null
closed-reason: null
---

## Context

`Variation#format` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variation.rb`) calls `transformations.fetch(:format, :png)`. CLAUDE.md's Hash table prescribes `Object.hasOwn(h, "k") ? h.k : default` for that call and says the call gates credit the form on the receiver Rails names. On `this.transformations` the gate does not: `packages/activestorage/src/variation.ts` `format` reports `+ activestorage variation.ts format fetch` without its `@missingRailsCall fetch — PERMANENT` receipt (seen at trails#9606, 6150a26cbf).

## Acceptance criteria

- `parity:api:calls` credits the `Object.hasOwn` form of a two-argument `fetch` on a member receiver such as `this.transformations`.
- The `@missingRailsCall fetch` receipt on `Variation#format` is deleted and the gate stays green.
