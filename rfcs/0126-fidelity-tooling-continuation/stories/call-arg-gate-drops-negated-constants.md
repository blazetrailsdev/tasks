---
title: "call-arg-gate-drops-negated-constants"
status: draft
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `0126/call-arg-gate-drops-negated-numeric-arguments` (PR #7350),
which folded the NUMERIC half of this and left the rest measured but invisible.

The Ruby extractor throws away WHICH unary operator was applied:

- `scripts/api-compare/extract-ruby-api.rb#describe_unary` returns
  `"unary#{describe_arg(inner, flags)}"` for everything that is not a negated
  `@int`/`@float`, so `-Float::INFINITY`, `!x` and `~mask` all describe as
  `unary` + the operand alone.
- `scripts/api-compare/extract-ts-api.ts#describeArg` does the same for a
  `PrefixUnaryExpression` that is not `MinusToken` + `NumericLiteral`.
- `scripts/api-compare/call-args.ts:363` returns `OPAQUE` for any descriptor
  starting with `unary`, which makes the WHOLE call site uncomparable.

Two consequences:

1. A negated CONSTANT is never compared. `dump_compressed(entry,
-Float::INFINITY)` (`activesupport/lib/active_support/cache/coder.rb:17`
   region) is opaque, and a port passing `Infinity` where Rails passes
   `-Float::INFINITY` is not flagged.
2. `literals.ts`'s `NEGATIVE_INFINITY` row is reachable from the TS half only —
   the comment at `literals.ts:155-158` says so explicitly. It is listed for
   symmetry with the positive one and no Ruby row can ever look it up.

The fold PR #7350 shipped deliberately stopped at the numeric case, because
matching a negated constant needs the operator preserved in the descriptor,
which is a wider change than that story's converged shape allowed.

## Converged shape

Record the operator: emit `unary:<op><operand>` (`unary:-@const:INFINITY`,
`unary:!id:x`) from both extractors, keeping the descriptor opaque in
`call-args.ts` as today EXCEPT where the operand normalizes to a value the
spelling table knows — a `-` over a `const:` whose
`normalizeConstantSpelling` yields a `num:` maps onto the negated numeric key,
so Ruby's `-Float::INFINITY` pairs with TS `-Infinity` /
`Number.NEGATIVE_INFINITY`. Every other unary stays opaque, exactly as now;
this is a spelling table lookup, not a general unary-expression comparator.

Note the descriptor change is a wire-format change to `rails-api.json` /
`ts-api.json`, so both extractors and every consumer of the `unary` prefix must
move together, and `extractor-skew.test.ts` will want the new shape.

## Acceptance criteria

- [ ] Both extractors record the unary operator; a matching test on each side.
- [ ] `-Float::INFINITY` compares equal to TS `-Infinity` and to
      `Number.NEGATIVE_INFINITY`, and a genuine divergence (Rails
      `-Float::INFINITY`, port `Infinity`) FLAGS.
- [ ] Every other unary stays opaque — `!x`, `~x`, a negated call.
- [ ] Report the `opaqueRubyArg` / `opaqueTsArg` skip-reason movement.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; any
      surfaced row is converged or baselined with a reviewed reason, and any
      mark that tightens uses `pnpm parity:api:calls:tighten` — never a reseed.
