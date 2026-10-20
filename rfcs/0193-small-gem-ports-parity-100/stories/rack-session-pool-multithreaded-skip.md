---
title: "rack-session-pool-multithreaded-skip"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9111
claim: "2026-10-20T00:37:57Z"
assignee: "rack-session-pool-multithreaded-skip"
blocked-by: null
closed-reason: null
---

## Context

Left over from `rack-session-residual-pool-and-abstract-id` (pool.rb is 8/8, the
`abstract/id.json` shard is gone, the abstract/id skip cites CLAUDE.md's
`inherited` section).

- `packages/rack-session/src/pool.test.ts:225` "should merge sessions when
  multithreaded" is `it.skip` with a PERMANENT-SKIP line that cites no ratified
  CLAUDE.md section. Rails: `vendor/rack-session/v2.1.1/test/spec_session_pool.rb:228-266`.
  Without `$DEBUG` the body is `1.must_equal 1; next`, but parity:test counts the
  6 static assertions, the rest behind `Thread.new` / `Thread.stop` / `join`.

## Acceptance criteria

- [ ] The test is ported (the `$DEBUG`-off arm, with the counter fixed in the
      assertion comparer if needed), or its skip cites a section ratified by the
      repo owner.
