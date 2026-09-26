---
title: "Lift the stale won't-do exclusion of migration/compatibility.rb and compatibility_test.rb"
status: draft
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts:11-43` still excludes both
`activerecord/lib/active_record/migration/compatibility.rb` (the
`"migration/compatibility"` pattern) and `test/cases/migration/compatibility_test.rb`
(the anchored `testFile` row) as "won't-do". Both reasons say the registry is
"version \"1.0\" only" and "nothing is added to it". That is no longer true:
`packages/activerecord/src/migration/compatibility.ts` now ports the whole
chain `V8_0`..`V4_2` (`compatibility.rb:1-487`; V5_0/V4_2 landed in trails#8123).

Consequences of the stale exclusion:

- `parity:api` does not measure `compatibility.rb`, so the V\* classes' method
  names, call sets and argument shapes are ungated.
- `compatibility_test.rb` counts for nothing. trails#8123 had to port its 4.2
  cases (`compatibility_test.rb:37-145`) into
  `migration/compatibility.trails.test.ts`, where `parity:test` can't match
  them.

## Acceptance criteria

- [ ] Remove the `migration/compatibility` source pattern from `unscoped.ts`, and the
      matching row from `baseline.json`, so `compatibility.rb` enters `parity:api`.
      Converge or receipt any calls / extra-surface rows that surface.
- [ ] Remove the `compatibility_test.rb` testFile row (and its baseline.json twin).
      Port `compatibility_test.rb` into `migration/compatibility.test.ts` under
      Rails' names, and move the cases from `compatibility.trails.test.ts` into it.
      Park any case whose version isn't ported with a per-test row.
