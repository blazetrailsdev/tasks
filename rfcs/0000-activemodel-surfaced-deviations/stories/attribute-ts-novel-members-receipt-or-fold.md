---
title: "activemodel: attribute.ts's four unreceipted novel members — fold or receipt"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activemodel` scores 5 novel names in
`packages/activemodel/src/attribute.ts`, none receipted:

- `fromUserWithValue` (attribute.ts:271-278) — Rails builds this via
  `from_user` with the explicit 5th `value` ctor arg
  (`vendor/rails/activemodel/lib/active_model/attribute.rb:12-13`, `:33`);
  fold into `fromUser` or receipt.
- `overrideCastValue` (attribute.ts:235-240) — Rails' one caller uses
  `instance_variable_set`; a JS-privacy shortcoming, plausibly
  `@noRailsEquivalent PERMANENT`.
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
