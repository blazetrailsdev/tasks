---
title: "Converge Error#optionsEqual's identity arm onto Ruby value equality for Date/Time/Range"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6792
claim: "2026-08-20T21:03:53Z"
assignee: "converge-check-validity-hash-readers"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/error.ts`'s private `optionsEqual` is trails' stand-in
for Ruby `==`, which JS `===` is not. `error.rb` depends on Ruby value equality
at three sites:

- `match?` compares option values with `!=` (`error.rb:171`)
- `strict_match?` compares whole hashes with `==` (`error.rb:187`)
- `==` compares the `attributes_for_hash` arrays elementwise (`error.rb:190-192`)

PR #6780 made the shim's dispatch mirror Ruby's: `Array#==` and `Hash#==` recurse
(a Ruby Hash is a plain object here), `Regexp#==` compares source + flags, and
anything else is sent `==` — its own `equals()` if it defines one, otherwise
`BasicObject#==` identity. That fixed a latent false positive (two distinct
`Date`s both have zero enumerable own keys, so the previous key-set walk returned
`true` for _any_ two Dates) and unlocked `equals()` as Rails' one-liner.

**The residual gap is the other direction.** Ruby's `Date#==`, `Time#==` and
`Range#==` are _value_ equality, and trails models none of them with an
`equals()` method, so they now land on the identity arm:

```ts
error.options = { count: 2..5 }   // two equal Ranges built separately
a.match("x", ":too_long", { count: range2 })  // false; Ruby says true
```

Rails' own validators put exactly these shapes in `options` —
`validates_length_of :name, in: 5..20` and the comparison validators'
`greater_than: some_date` — so the shapes that miss are ones Rails produces.

## Converged shape

Send `==` the way Ruby does, for the types Rails actually puts in `options`:
either give the trails `Date` / `Duration` / range analogues an `equals()` that
`optionsEqual`'s existing dispatch arm already looks for, or extend the arm to
recognise them. The `equals()` dispatch is already in place
(`error.ts`, the arm below the plain-object branch) — this is about the receivers
answering it, not about the shim's shape.

## Acceptance criteria

- Two separately-constructed but equal `Date` / `Time` / range option values
  compare equal through `match`, `strictMatch` and `equals`.
- No new public surface: `pnpm parity:api:extra --package activemodel` keeps
  `error.ts` at 0 novel.
- Regression test fails on the pre-change baseline.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
