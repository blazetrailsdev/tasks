---
title: "Record the ratified Proc-call reason on the two `call` baseline rows"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: 6552
claim: "2026-08-14T23:45:08Z"
assignee: "record-ratified-proc-call-reason"
blocked-by: null
closed-reason: null
---

# Record the ratified Proc-call reason on the two `call` baseline rows

## Context

`converge-proc-call-receiver-in-shard-selector-and-normalization` was closed
won't-do by maintainer decision (2026-08-14): a JS function **is** the Ruby
Proc. Rails' `shard_resolver` / `normalizes(with:)` lambdas are stored and
handed straight back by `attr_reader` (`shard_selector.rb:34,37`;
`normalization.rb:90,121-126`), which is exactly what trails already does, so
`resolver.call(request)` vs `resolver(request)` is a language-level spelling
difference with no behavioral gap. `Function.prototype.call` cannot serve as
the receiver (it rebinds `this`), and a trails `Proc` wrapper would either
force `new Proc(fn)` on the user-facing API or break the reader identity
`normalization.rb:146,152` depends on.

Two call-set baseline rows still carry the unreviewed RFC 0047 seed string for
this exact divergence:

- `scripts/api-compare/call-mismatches-exclude/activerecord/normalization.json`
  — `{ rubyName: "normalize", call: "call" }`
  (Rails `normalization.rb:121-126`; trails
  `packages/activerecord/src/normalization.ts`)
- `scripts/api-compare/call-mismatches-exclude/activerecord/middleware/shard-selector.json`
  — `{ rubyName: "selected_shard", call: "call" }`
  (Rails `middleware/shard_selector.rb:34-37`; trails
  `packages/activerecord/src/middleware/shard-selector.ts`)

Both read "Baseline (RFC 0047): wide call-set flag seeded when the wide ratchet
landed; bucket (b) equivalent or (c) noise pending per-cluster burndown review."
That review has now happened and landed on (b) equivalent — the seed should say
so, so the next burndown pass does not re-derive the whole analysis.

Out of scope: the sibling `{ rubyName: "set_shard", call: "fetch" }` row in the
same shard-selector file. That one is a real divergence
(`options.fetch(:lock, true)` is key-presence, not `?? true`) and is already
owned by RFC 0082's `ShardSelector: options.fetch(:lock, true) is key-presence,
not ?? true`.

## Acceptance criteria

- [ ] Both `call: "call"` rows carry the reviewed reason recording the ratified
      finding: a JS function is the Ruby Proc, `attr_reader` hands the caller's
      own lambda back unchanged, `Function.prototype.call` rebinds `this` and
      cannot be the receiver, and a `Proc` wrapper would break the
      `normalizer` identity check at `normalization.rb:146,152`.
- [ ] The edits go through `serializeBaseline` — never a hand-edit of the JSON
      and never `--write`/reseed, which would rewrite the whole exclude tree.
- [ ] No other row in either shard changes; the `set_shard`/`fetch` row keeps
      its seed and stays with RFC 0082.
- [ ] Row count is unchanged (this is a reason edit, not a converge or a
      widening) and `pnpm parity:api:calls` is green.
