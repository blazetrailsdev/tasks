---
title: "Track: error-class naming convergence"
status: draft
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Track: error-class naming convergence

## Context

Ruby reads an exception's Rails-visible name via `e.class.name`; the JS
analogue is `e.name` (the constructor name is not where the name lives — a
minified or subclassed constructor breaks it). Names must be fully qualified
(`ActiveRecord::RecordNotFound`) for message parity with Rails. Error families
live in `packages/activerecord/src/errors.ts` (imported at
`packages/activerecord/src/relation/finder-methods.ts:17`) and sibling
packages' `errors.ts`. The rails-error-parity exclude file already acts as a
ratchet for message parity.

Existing scattered stories (reference, do not re-home):
`activerecord-error-name-fully-qualified` (0023, draft),
`rails-error-parity-activemodel-rangeerror-rename` (0025, done — precedent).

## Acceptance criteria

- Sweep of all error classes across Rails-mirroring packages: `name` set to the
  fully qualified Rails constant; no site reads `constructor.name` for a
  Rails-visible name.
- The draft story above resolved.
- rails-error-parity ratchet entries pruned as pairs converge (it is a ratchet,
  not a precedent).
