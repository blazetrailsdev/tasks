---
title: "compute_cache_version open-codes <=> and rb_cmperr; route it onto the ruby-compat Comparable primitive"
status: ready
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7258 (`compute-cache-version-max-swallows-nil`) made the loaded branch of
`Relation#compute_cache_version` fail the way Ruby's `Array#max` does
(`activerecord/lib/active_record/relation.rb:476-479` —
`records.map { |record| record.read_attribute(timestamp_column) }.max`). Because
`Temporal.Instant` carries no relational operators and JS has no `<=>`, the
reduce in `packages/activerecord/src/relation.ts` (`computeCacheVersion`) now
spells out both halves of MRI's comparison inline:

- the `Temporal.Instant.compare` / `>` dispatch, and
- a local `rubyClassName` arrow plus a `throw new ArgumentError(...)` that
  reproduces `rb_cmperr` (`object.c`): the message is
  `comparison of <class of the running max> with <class-or-inspect of the
incoming value> failed`, with a special const rendered by `inspect` (`nil`,
  not `NilClass`).

Verified against MRI 3.3: with a real `Array#max` receiver,
`a = [Time.now, nil]; a.max` raises `comparison of Time with nil failed` and
`[nil, Time.now]` raises `comparison of NilClass with Time failed`. (An inline
array literal compiles to `opt_newarray_send` and reports the operands the other
way round — do not verify this with a literal.)

`ruby-compat-comparable` (RFC 0129) is already collecting the three hand-rolled
spaceship implementations in activesupport/date onto one primitive. This is a
fourth site, plus the `rb_cmperr` message construction that primitive will need
anyway; it is filed separately because it lands in activerecord and depends on
that story shipping first.

## Converged shape

Once `ruby-compat`'s `Comparable` / `<=>` primitive exists, `computeCacheVersion`
calls it instead of open-coding the dispatch, and the `rb_cmperr` message
(including the `inspect`-for-special-consts rule and the operand order above)
moves onto that primitive rather than living as a local `rubyClassName` arrow in
`relation.ts`. `relation.ts` keeps Rails' body shape: a `max` over the mapped
timestamps that raises when a nil reaches the comparison.

## Acceptance criteria

- [ ] `computeCacheVersion`'s loaded branch has no local comparator or
      class-name helper; it calls the ruby-compat primitive.
- [ ] The `ArgumentError` message and operand order are unchanged —
      `packages/activerecord/src/collection-cache-key-nil-timestamp.trails.test.ts`
      passes untouched.
- [ ] `pnpm vitest run packages/activerecord/src/collection-cache-key.test.ts`
      green.
