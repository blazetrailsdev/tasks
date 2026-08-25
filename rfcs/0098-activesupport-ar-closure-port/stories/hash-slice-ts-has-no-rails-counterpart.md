---
title: "core-ext/hash/slice.ts reports [no Rails counterpart]"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6506
claim: "2026-08-14T01:57:12Z"
assignee: "converged-row-stale-mark-forces-whole-tree-reseed"
blocked-by: null
closed-reason: null
---

# `core-ext/hash/slice.ts` reports `[no Rails counterpart]`

## Context

`packages/activesupport/src/core-ext/hash/slice.ts` is the port of
`vendor/rails/activesupport/lib/active_support/core_ext/hash/slice.rb`, and now
holds both of that file's methods — `extract!` (slice.rb:24-26, moved by #6468)
and `slice!` (slice.rb:10-17, moved by #6499).

`pnpm parity:api:extra` nonetheless scores the file as
`core-ext/hash/slice.ts — 1 novel, 2 moved [no Rails counterpart]`, with `Slice`
counted novel: the comparator is not mapping the TS file onto slice.rb even
though the path translation in `docs/ruby-ts-conventions.md` produces exactly
this path. Both methods therefore score as "moved" (found in a different .rb)
rather than matched, and the file's own port is invisible to `parity:api`.

## Converged shape

The file maps onto `core_ext/hash/slice.rb`, `sliceBang` / `extractBang` match
their Ruby counterparts, and the phantom `Slice` name stops being scored.

## Acceptance criteria

- [ ] `parity:api` matches `core-ext/hash/slice.ts` to
      `activesupport/lib/active_support/core_ext/hash/slice.rb`.
- [ ] `parity:api:extra` no longer reports the file as `[no Rails counterpart]`
      nor `Slice` as novel.
- [ ] `parity:api` delta non-negative.
