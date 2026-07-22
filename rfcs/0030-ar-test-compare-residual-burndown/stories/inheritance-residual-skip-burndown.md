---
title: "inheritance-residual-skip-burndown"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 19
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (2026-07-22) reports 12 matchedSkipped in `inheritance.test.ts` —
`it.skip` stubs at packages/activerecord/src/inheritance.test.ts:100,105,110,
192,225,232,238,310,371,508,523,543:

- compute type no method error / on undefined method / argument error (3) —
  Ruby compute_type/constantize error semantics; triage TS analogue vs
  permanent-skip.
- base class activerecord error; becomes sets variables before initialization
  callbacks; becomes and change tracking for inheritance columns; alt becomes
  bang resets inheritance type column; new with ar base; new with autoload
  paths; scope inherited properly; instantiation doesnt try to require
  corresponding file; inheritance new with subclass as default.

Rails: vendor/rails/activerecord/test/cases/inheritance_test.rb. The
require/autoload ones are likely Ruby-only permanents — record reasons; port
the rest (becomes/STI family is portable).

## Acceptance criteria

- [ ] Each skip triaged: real body ported and passing, or permanent-skip with a
      recorded ROOT-CAUSE reason per the RFC Deferred table.
- [ ] inheritance.test.ts matchedSkipped drops accordingly.
