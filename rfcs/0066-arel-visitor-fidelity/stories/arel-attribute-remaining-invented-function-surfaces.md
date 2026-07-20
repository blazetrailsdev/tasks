---
title: "Audit remaining invented Attribute function surfaces (substring/replace/abs/upper/length)"
status: ready
updated: 2026-07-20
rfc: "0066-arel-visitor-fidelity"
cluster: null
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

While retiring the invented `Attribute#coalesce` (PR #5007), the surrounding
block in `packages/arel/src/attributes/attribute.ts` (~lines 500-570) showed
several more methods with no counterpart in
`vendor/rails/activerecord/lib/arel/attributes/attribute.rb` or the modules it
includes (`predications.rb`, `alias_predication.rb`, `expressions.rb`,
`math.rb`, `order_predications.rb`): `substring`, `replace`, `abs`, `upper`,
`length`. Rails' Arel builds these via `Nodes::NamedFunction` at the call site,
not as attribute predications.

Audit each against the vendored source and either find its Rails home or
retire it, the same resolution applied to `coalesce` in #5007.

## Acceptance criteria

- [ ] Each named method audited against vendored Arel; kept only if a Rails
      counterpart exists, in its Rails-layout file.
- [ ] Retired methods have no surviving callers under `packages/`.
- [ ] api:compare / test:compare delta non-negative.
