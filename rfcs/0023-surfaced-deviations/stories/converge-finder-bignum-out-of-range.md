---
title: "converge-finder-bignum-out-of-range"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4433
claim: "2026-07-02T18:57:57Z"
assignee: "converge-finder-bignum-out-of-range"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by faithful-port-finder-exists-cluster. `finder_test.rb:371-393`
(`test_exists_with_large_number`) exercises id predicates with bignums beyond
signed int64 (±2^63): `Topic.where(id: [1, 9223372036854775808])`,
`where(id: 1..9223372036854775808)`, and `predicate_builder[:id, val, :gt/lt]`
bounds. Rails resolves these without error — out-of-range values are
handled/clamped so the comparison still evaluates.

trails raises `ActiveModelRangeError: 9223372036854775808 is out of range for
MysqlBigInteger/PgInteger8 with limit 8 bytes` when binding 2^63 to the 8-byte
`id` column on MySQL/PG. SQLite does not enforce the range, so the test passes
there but fails on the MariaDB and PostgreSQL CI lanes.

The faithful port lives at finder.test.ts `exists with large number`, currently
`it.skip`'d (the ported body — bigint ranges/arrays plus Arel gt/gteq/lt/lteq
nodes standing in for Rails' 3-arg `predicate_builder[]` subscript — is ready to
un-skip once the range handling matches Rails).

## Acceptance criteria

- [ ] Finder/predicate-builder handles out-of-range bignum id values the way
      Rails does (no ActiveModelRangeError; comparison resolves) across SQLite,
      MySQL, and PostgreSQL.
- [ ] Un-skip `exists with large number`; it passes on all three adapters.
