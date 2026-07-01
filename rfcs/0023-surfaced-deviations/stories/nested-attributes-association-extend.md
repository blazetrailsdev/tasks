---
title: "nested-attributes-association-extend"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `converge-nested-attributes-test-one-schema`. The
`TestNestedAttributesWithExtend > extend affects nested attributes` case is
skipped (tracked-pending-convergence) in
`packages/activerecord/src/nested-attributes.test.ts`.

The `extend:` option on an association (Rails
`has_many :treasures, as: :looter, extend: Pirate::PostTreasuresExtension`) is
not wired into nested-attributes builds, so an extension module's overrides
(e.g. a `build` that names the record "from extension") do not run.

## Acceptance criteria

- [ ] Association `extend:` module methods apply on the nested-attributes build path.
- [ ] Un-skip the extend case and make it pass.
