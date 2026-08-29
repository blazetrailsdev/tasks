---
title: "Call-arg gate: fold a negated numeric argument instead of dropping the site as opaque"
status: draft
updated: 2026-08-29
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while working `0126/value-equivalent-constant-spellings` (PR #7210).

The call-ARGUMENT comparator treats every unary-negated argument as opaque, so a
negated numeric argument is never compared at all:

- `scripts/api-compare/extract-ruby-api.rb:3168` describes a `:unary` argument as
  `"unary#{describe_arg(node[2], flags)}"`, unconditionally.
- `scripts/api-compare/call-args.ts` then returns `OPAQUE` for any descriptor
  starting with `unary`, which makes the WHOLE call site uncomparable, not just
  that one argument.

The extractor already knows how to fold the negation — it does exactly that on
the LITERAL-default path at `extract-ruby-api.rb:264-273`, where Ripper's
`[:unary, :-@, [:@int, "1"]]` becomes `{ kind: "int", value: "-1" }` with the
comment "Fold the negation back into the numeric value; anything else stays
expr." The argument path never got the same treatment.

Consequence: `foo(-1)` and `dump_compressed(entry, -Float::INFINITY)` are both
invisible to the argument gate, and a port passing `1` where Rails passes `-1`
is not flagged. It also means PR #7210's `NEGATIVE_INFINITY` spelling-table entry
is unreachable from the Ruby side — it is listed for symmetry with the positive
one, and can only ever be looked up from the TS half.

## Converged shape

Give the argument path the same fold the literal path already has: a `:unary`
node whose operator is `:-@` and whose operand is an `@int` / `@float` emits
`num:-<value>`, and anything else stays `unary…` / opaque as today. Keep the
change to the numeric case only — this is the fold that already exists one
function away, not a general unary-expression comparator.

Once folded, `literals.ts#normalizeConstantSpelling`'s `NEGATIVE_INFINITY` entry
becomes reachable and `-Float::INFINITY` pairs with JS `-Infinity` /
`Number.NEGATIVE_INFINITY`.

## Acceptance criteria

- [ ] A negated numeric ARGUMENT extracts as `num:-<value>`, matching the
      literal-default path at `extract-ruby-api.rb:264-273`; a non-numeric unary
      operand stays opaque.
- [ ] Unit-tested both directions, including that a genuine sign divergence
      (Rails `-1`, port `1`) now FLAGS rather than being skipped.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; any
      row the change surfaces is converged or baselined with a reviewed reason,
      and any mark that tightens is narrowed with
      `pnpm parity:api:calls:tighten` — never reseeded.
- [ ] Report the skip-reason tally movement (`opaqueRubyArg` should drop).
