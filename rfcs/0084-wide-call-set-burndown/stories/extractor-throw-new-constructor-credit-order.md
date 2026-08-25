---
title: "Stop crediting a thrown new X() as a constructor call ahead of the real one"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6464
claim: "2026-08-13T14:06:37Z"
assignee: "extra-surface-scores-overridden-ruby-files"
blocked-by: null
closed-reason: null
---

## Context

PR #6404 baselined six `order:constructor,…` rows whose cause is not a port
divergence but the extractor's `constructor` credit. `collectCalls` credits
`constructor` for EVERY `new X(...)`, and the sequence is deduplicated at first
occurrence — so a `throw new Error(...)` early in a body (the port's spelling
of Ruby `raise ArgumentError, msg`, which is NOT a `.new` call and records
nothing) pins `constructor` ahead of the real `X.new` the Rails body makes
later. A TS-only `new Set(...)` or a `record.constructor` class reach does the
same.

Affected rows (all in `call-mismatches-exclude/`):

- `activerecord connection-adapters/postgresql/oid/range.ts cast_value` —
  Rails `range.rb#cast_value` raises with `raise ArgumentError, "…"`, ports to
  `throw new Error(...)` (range.ts:109), ahead of `::Range.new(*sanitize_bounds(...))`.
- `activesupport hash-utils.ts assert_valid_keys` — TS-only `new Set(validKeys)`
  (hash-utils.ts:192) ahead of the `ArgumentError.new` Rails builds
  (`activesupport/lib/active_support/core_ext/hash/keys.rb:52`).
- `activerecord nested-attributes.ts raise_nested_attributes_record_not_found!` —
  `record.constructor` (nested-attributes.ts:515) credited as `constructor`.
- `activerecord core.ts find`, `activerecord encryption/message-pack-message-serializer.ts hash_to_message`,
  `trailties rack/logger.ts call` — same class.

`lint-calls.ts` already filters `raise` as noise on the Ruby side; the TS side
has no matching treatment for the `throw new X(...)` it ports to.

## Acceptance criteria

1. Decide and implement the converged treatment in
   `scripts/api-compare/extract-ts-api.ts#collectCalls`: a `new X(...)` that is
   the operand of a `ThrowStatement` should not be credited as `constructor`
   (mirroring the Ruby side, where `raise` is filtered and `raise Foo, msg`
   makes no `new` call at all) — or state why the credit must stay.
2. Consider the `record.constructor` property read separately: it is a class
   reach, not an instantiation, and Ruby spells it `self.class`.
3. Re-measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls`; report rows
   retired and rows added, and delete every retired row by hand (only-shrink).
