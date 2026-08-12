---
title: "Converge Ruby Proc#call at the shard resolver and the normalizer"
status: blocked
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-12T19:16:52Z"
assignee: "converge-collection-callback-abort-catch-to-call-sites"
blocked-by: "Evaluated the Proc-wrapper direction and it costs more than it converges. Rails' Proc comes free from the language: `config.active_record.shard_resolver = ->(request){}` and `normalizes(with: ->(v){})` store the user's own lambda, and `attr_reader :resolver` / `:normalizer` hand it straight back (shard_selector.rb:34,37; normalization.rb:90,121-126). The JS analogue of that lambda is a plain function, which trails already stores unchanged. Spelling `resolver.call(request)` requires a wrapper object, and JS's own `Function.prototype.call` cannot be it (it rebinds `this`). Introducing an activesupport Proc class therefore forces either (a) users to construct `new Proc(fn)` at every proc-valued option — invented public surface Rails does not have, on the user-facing API — or (b) a wrap inside `initialize`, which Rails does not do, making the `resolver`/`normalizer` reader return something other than what was passed and breaking `normalizer == other.normalizer` identity (normalization.rb:146,152). Either arm trades two converged call spellings for a new divergence in the constructor and the readers, plus new extra surface. Needs a maintainer decision on a Ruby-Proc idiom before the four rows can retire."
closed-reason: null
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
