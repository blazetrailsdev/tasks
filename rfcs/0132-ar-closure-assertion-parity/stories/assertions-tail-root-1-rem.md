---
title: "assertions-tail-root-1-rem"
status: draft
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
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

Remainder of assertions-tail-root-1 (RFC 0132). relation/where_chain_test.rb is converged (0 mismatches, PR for assertions-tail-root-1).

Files still with assertion-count/kind mismatches under vendor/rails/activerecord/test/cases/:
sanitize_test.rb, inheritance_test.rb, serialized_attribute_test.rb, json_serialization_test.rb, transaction_instrumentation_test.rb, query_cache_test.rb.

Expand with `pnpm parity:test -- --package activerecord --assertions --missing` and grep each file.

Learnings from where_chain: `assert_raises` + `assert_match e.message` ports as `await expect(run()).rejects.toThrow(Cls)` then `const e = await run().catch(err => err); expect(e.message).toMatch(re)`; `assert_includes` is `toContainEqual`; `assert_predicate x, :any?` is `expect(await rel.isAny()).toBeTruthy()`; where_clause equality uses `whereClause.plus(...).invert()`.

## Acceptance criteria

- Each listed file reports 0 assertion mismatches; a converged test that fails on a production bug is parked it.skip with a BLOCKED: line and a story in 0155.
