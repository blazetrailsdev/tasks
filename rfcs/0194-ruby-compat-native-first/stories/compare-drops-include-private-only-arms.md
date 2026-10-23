---
title: "Compare: an arm whose only difference is include_private is permanently unportable, not a missing call or arm"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9252
claim: "2026-10-22T21:01:45Z"
assignee: "call-args-drops-visibility-boolean-argument"
blocked-by: null
---

## Context

`collapse-visibility-variants-of-send-and-respond-to` removes Rails arms that
only `include_private` distinguishes, for example
`!include_private_methods && super(method, true)`
(`activemodel/lib/active_model/attribute_methods.rb:528-533`). CLAUDE.md §
"Method visibility is compile-time only" ratifies that such an arm cannot
answer differently from its sibling. As the gates stand, each removal shows
up as a missing `super` / `respond_to?` call (`parity:api:calls`), a shape
row (`parity:api:calls:args`), and a missing arm (`parity:api:arms:*`). It
would need a `@missingRailsCall … PERMANENT` receipt per site.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` marks an arm whose condition reads only a visibility parameter (`include_private`, `include_all`, `priv`, or the second positional parameter of `respond_to?` / `respond_to_missing?`). It also marks a call whose only distinguishing argument is that literal `true`.
- [ ] `compare.ts`, `call-args.ts` and the arms comparison drop marked arms and calls from significance, under one named rationale constant citing the CLAUDE.md section. No name joins `NO_JS_CALL_FORM`.
- [ ] Tests cover three cases: the `attribute_methods.rb:528-533` shape is dropped, a non-visibility `elsif` in the same body still flags, and a `super(name, true)` outside a visibility arm still flags.
- [ ] Every `@missingRailsCall` receipt that this makes stale is removed in the same PR, and `parity:api:arms:throws` / receipt lints are green.

## Notes

This makes the removal path ruled 2026-10-16 mechanical. The collapse story
then needs no per-site receipts, and receipts remain only where this
detector cannot prove the arm.
