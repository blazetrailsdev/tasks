---
title: "BatchEnumerator should take Rails' seven kwargs, including cursor:/order:/use_ranges:"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6561
claim: "2026-08-15T12:15:05Z"
assignee: "batch-enumerator-carries-cursor-order-use-ranges"
blocked-by: null
closed-reason: null
---

# `BatchEnumerator` should take Rails' seven kwargs, including `cursor:` / `order:` / `use_ranges:`

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. The row

    activerecord | relation.ts | in_batches | new
    rubyArgs: [kwargs{cursor, finish, of, order, relation, start, useRanges}]

carries a reviewed reason rather than a fix.

`vendor/rails/activerecord/lib/active_record/relation/batches.rb:267-269`:

    unless block
      return BatchEnumerator.new(of: of, start: start, finish: finish,
        relation: self, cursor: cursor, order: order, use_ranges: use_ranges)
    end

trails' `BatchEnumerator` takes `(generator, of, { start, finish, relation })`
(`packages/activerecord/src/relation.ts:4535,4553`) — the async generator is
built at the call site, and `cursor`, `order` and `use_ranges` never reach the
enumerator at all.

Ruby's lazy Enumerable has no async equivalent, so the generator argument is
forced. The three DROPPED kwargs are not: a `BatchEnumerator` obtained without a
block and then re-enumerated cannot honour a non-default cursor, order or
`use_ranges`, which is a behaviour gap, not just an argument-shape one.

## Converged shape

`BatchEnumerator` carries `cursor`, `order` and `useRanges` alongside
`of`/`start`/`finish`/`relation`, so a blockless `in_batches(...)` re-enumerates
under the options it was given.

## Acceptance criteria

- [ ] The enumerator accepts and honours `cursor`, `order` and `useRanges`.
- [ ] Ported Rails tests covering blockless `in_batches` with a custom
      `cursor:` / `order:` pass (see `relation/batches_test.rb`).
- [ ] The `in_batches -> new` row is deleted by hand from its shard
      (no `--write`, no reseed).
- [ ] `pnpm parity:api:calls:args` green; all three adapter lanes green.
