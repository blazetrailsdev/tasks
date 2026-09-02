---
title: "activemodel: attribute.ts's four remaining unreceipted novel members — fold or receipt"
status: ready
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: ["attribute-override-cast-value-invented-mutator"]
deps-rfc: []
est-loc: 50
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activemodel` scores 5 novel names in
`packages/activemodel/src/attribute.ts`, none receipted. **`overrideCastValue`
is NOT in scope here** — it is owned by the sibling story
`attribute-override-cast-value-invented-mutator` (carried into this RFC from
0023), which establishes that Rails DOES have a counterpart concept —
the value-returning `with_cast_value` (`attribute.rb:87`) — so it converges
rather than earning a receipt. Do not re-frame it as PERMANENT.

The remaining four:

- `fromUserWithValue` (attribute.ts:271-278) — Rails builds this via
  `from_user` with the explicit 5th `value` ctor arg
  (`vendor/rails/activemodel/lib/active_model/attribute.rb:12-13`, `:33`);
  fold into `fromUser` or receipt.
- `getOriginalAttribute` / `setOriginalAttribute` (attribute.ts:263-268) —
  Rails uses a protected `original_attribute` reader +
  `instance_variable_set` (attribute.rb:37, :49); same class of shortcoming,
  but check whether a protected TS field + friend access covers the call
  sites before receipting.
- `[rubyNamespace]` (attribute.ts:30-33 and the four subclass repeats) —
  JS-Symbol private-key use, sanctioned; verify the extractor already
  excludes it and receipt only if it actually scores.

## Acceptance criteria

- Each of the five is folded into its Rails counterpart, deleted, or carries a
  legal `PERMANENT`/`CONVERGEABLE <story-id>` receipt.
- `attribute.ts` novel count drops to the receipted set in
  `parity:api:extra`.
