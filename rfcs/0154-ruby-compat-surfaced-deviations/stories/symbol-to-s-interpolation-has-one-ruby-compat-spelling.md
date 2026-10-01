---
title: "Symbol#to_s interpolation is open-coded as isSymbol ? symbolToS at 26 sites"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
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

A Ruby Symbol whose Symbol-ness is observable is a colon-prefixed string in trails (`":blank"`), so
Ruby's `#{sym}` / `sym.to_s` — which answers the bare name — cannot be a JS template interpolation.
Every such site open-codes the same expression, `isSymbol(x) ? symbolToS(x) : x`
(`packages/ruby-compat/src/symbol.ts:26,40`): 26 non-test sites today — activesupport 9,
activerecord 6, actionpack 4, actionview 3, ruby-compat 2, activemodel 1, i18n 1. Examples:
`packages/activemodel/src/error.ts` `Error#inspect` (twice, for `#{@attribute}` and `#{@type}`,
`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:200`),
`packages/actionpack/src/action-dispatch/journey/route.ts:213`,
`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:359`,
`packages/actionpack/src/action-dispatch/http/mime-type.ts:313`.

`rbObjAsString` (`packages/ruby-compat/src/object.ts`, `rb_obj_as_string`,
`vendor/ruby/v3.3.11/string.c:1653`) is the port of `#{}` and has no Symbol arm: it falls to
`String(value)` and keeps the colon. `rbInspect`'s `inspectValue` already reads a colon-string as a
Symbol (`symInspect`), so the two halves of the same convention disagree. Adding the arm to
`rbObjAsString` is not free: its 22 other callers include quoting, sanitization and tagged-logging
paths that hand it plain user strings, where a leading `:` must survive. trails#8313's reviewer asked
for one helper applied uniformly and the PR had to answer with the ternary twice.

Related: `rb-obj-as-string-skips-to-s-dispatch`, `rb-obj-as-string-has-no-proc-arm`,
`i18n-symbol-to-s-single-boundary`.

## Acceptance criteria

- [ ] Decide, with the 22 `rbObjAsString` call sites audited, whether `Symbol#to_s` (`vendor/ruby/v3.3.11/string.c` `rb_sym_to_s`) becomes an arm of `rbObjAsString` or one ruby-compat function for a value Rails knows to be Symbol-or-String; record the audit in the PR body.
- [ ] All 26 open-coded `isSymbol(x) ? symbolToS(x) : x` sites call it; a grep for the ternary in `packages/*/src` finds none outside ruby-compat.
- [ ] A plain string with a leading colon passed through quoting / sanitization keeps its colon (regression test).
