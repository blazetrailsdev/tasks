---
title: "Converge Ruby Proc#call at the shard resolver and the normalizer"
status: closed
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
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
closed-reason: "Won't-do (maintainer decision 2026-08-14): a JS function IS the Ruby Proc. Rails' shard_resolver/normalizes lambdas (shard_selector.rb:34,37; normalization.rb:90,121-126) are stored and handed back unchanged, which trails already does; '.call' is a language-level spelling difference with no behavioral gap, and Function.prototype.call cannot serve as it (it rebinds this). A Proc wrapper would force new Proc(fn) on the user-facing API or break normalizer identity (normalization.rb:146,152). Baseline the 4 call-argument rows under one shared reason instead."
---

## Context

The last two `kind: "args"` rows left by `call-args-ar-host-param-core`
(PR #6427) are the same shape, and both are Ruby `Proc#call`:

- `scripts/api-compare/call-mismatches-exclude/activerecord/middleware/shard-selector.json`
  — `selected_shard` → `resolver`: Rails `()` vs trails `(ref:request)`.
  Rails `activerecord/lib/active_record/middleware/shard_selector.rb:51`:
  `resolver.call(request)` — the `attr_reader :resolver` (`shard_selector.rb:37`)
  is read with NO arguments, and `Proc#call` takes the argument.
  trails `packages/activerecord/src/middleware/shard-selector.ts` `selectedShard`
  spells it `this.resolver(request)`.
- `scripts/api-compare/call-mismatches-exclude/activerecord/normalization.json`
  — `normalize` → `normalizer`: Rails `()` vs trails `(ref:value)`.
  Rails `activerecord/lib/active_record/normalization.rb:145`:
  `normalizer.call(value) unless value.nil? && !normalize_nil?`.
  trails `packages/activerecord/src/normalization.ts` `normalize` spells it
  `normalizedType.normalizer(value)`.

Both files also carry the matching call-SET row for the missing `call`
(`selected_shard` → `call`, `normalize` → `call`), so the divergence costs two
baseline rows per site, not one.

The blocker is that a JS function IS the callable: `f(x)` collapses Ruby's two
calls (`normalizer` then `Proc#call`) into one, and the arguments land on the
attribute read. `Function.prototype.call(x)` is not the escape hatch — it
rebinds `this` to `x`.

## Converged shape

The direction to evaluate is modelling a Ruby Proc as an object with a `call`
method (a `Proc`-shaped wrapper in `@blazetrails/activesupport`) at the
boundaries where Rails stores a Proc in an attribute and invokes it through
`Proc#call` — `shard_resolver`, `normalizes(with:)`, and the other
proc-valued options. Then `this.resolver.call(request)` and
`normalizer.call(value)` are spelled exactly as Rails spells them, and both the
args rows AND the call-set rows retire.

Scope this story to the two sites above; if the wrapper turns out to be
justified, a follow-up can sweep the remaining proc-valued options. If the
evaluation concludes the wrapper costs more than it converges, `pnpm tasks
block` with the specific finding rather than re-ratifying the rows.

## Acceptance criteria

1. `shard_selector.rb:51` and `normalization.rb:145` are spelled with the same
   two calls Rails makes, verified against the vendored source.
2. The four baseline rows (2 `kind: "args"`, 2 call-set) are DELETED by hand
   (only-shrink; never `--write`).
3. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
