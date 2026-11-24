---
title: "trails-tsc types associations declared in a concern included hook"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails-tsc types association readers from `this.hasMany(...)` calls in a model's static block, but not from those a concern makes in its `included` hook (`examples/electron-writebook/app/models/book/accessable.ts` `has_many :accesses`, `leaf/editable.ts` `has_many :edits`, `concerns/positionable.ts` scopes). The example adds `declare accesses: CollectionProxy<Access>` etc. by hand.

## Acceptance criteria

- trails-tsc derives association and scope types declared in an `included` hook of a concern a model includes, and the example's hand-written `declare`s for them are deleted.
