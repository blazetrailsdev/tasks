---
title: "support/adapter-helper.ts (support/adapter_helper.rb)"
status: ready
updated: 2026-07-26
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 250
priority: 45
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/support/adapter_helper.rb` (104 lines) is the
`AdapterHelper` module: `current_adapter?(*types)`, `in_memory_db?`,
`sqlite3_adapter_strict_strings_disabled?`, `mysql_enforcing_gtid_consistency?`
and friends — the predicates AR tests gate on.

trails scatters the same predicates: `inMemoryDb` lives in `test-adapter.ts`,
`currentAdapter` appears in `model-schema.ts`, and the remaining capability
gates live in `support/supports.ts` (an invented name with no Rails
counterpart). `test-adapter.ts` itself has no Rails counterpart by name —
its content maps to `adapter_helper.rb` plus `connection_helper.rb`.

See this RFC's README for the target layout and the A-D disposition.
Assumes `move-test-helpers-to-support-dir` has landed.

## Acceptance criteria

- Create `support/adapter-helper.ts` mirroring `adapter_helper.rb`'s method set
  with matching names (`currentAdapter`, `inMemoryDb`,
  `sqlite3AdapterStrictStringsDisabled`, `mysqlEnforcingGtidConsistency`, …).
- Move the scattered predicates into it; leave `model-schema.ts`'s production
  use alone if it is genuinely production code (check first — a test predicate
  living in a production file is itself a finding worth noting).
- Read `adapter_helper.rb` in full before porting: only port predicates Rails
  actually has, and do not invent new ones to cover trails-specific gates.
  Anything in `supports.ts` with no `adapter_helper.rb` counterpart stays put
  with a comment saying why.
- Do NOT rename any test that uses these predicates.
