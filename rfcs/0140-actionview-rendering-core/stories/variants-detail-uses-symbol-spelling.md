---
title: "variants lookup detail uses the :symbol string spelling like formats"
status: closed
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#8141 (6143f680f6): PathParser#parse yields ':<variant>' (resolver.ts:281), resolver.trails.test.ts:116-118 match with variants: [':phone'], and template/digestor.test.ts:440-441 'variants' passes [':iphone'] as Rails passes [:iphone]."
---

## Context

Rails' `variants` lookup detail holds Symbols (`register_detail(:variants) { [] }`,
`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:51`), e.g.
`finder.variants = [:iphone]` (`actionview/test/template/digestor_test.rb:257-262`).
trails spells a Ruby Symbol value as a `":name"` string (CLAUDE.md, "A Ruby Symbol is a JS
string") and `formats` already follows it (`":html"`, `":json"`), but `variants` is
compared bare: PR #8136's digestor `variants` test had to pass `["iphone"]`, and
`template/resolver.trails.test.ts:57-58` uses `["phone"]`.

## Acceptance criteria

- `LookupContext#variants=` / template details carry `":iphone"`, matching formats.
- Resolver variant matching (`TemplateDetails::Requested`, `template_details.rb`) compares the colon form.
- `digestor.test.ts` `variants` passes `[":iphone"]` as Rails passes `[:iphone]`.
