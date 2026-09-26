---
title: "PathParser#parse leaves locale, handler and variant bare strings"
status: closed
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#8141 (6143f680f6, 'Template detail values are Ruby Symbols'): origin/main template/resolver.ts PathParser#parse (:275-281) spells locale/handler/variant as ':'-prefixed Symbols alongside format; handlers detail is TemplateHandlers.extensions() (Symbols) and the locale default stringToSym's each value (lookup-context.ts:24-33)."
---

## Context

`Resolver::PathParser#parse` symbolizes all four detail captures
(`vendor/rails/actionview/lib/action_view/template/resolver.rb:35-39`):
`match[:locale]&.to_sym`, `match[:handler]&.to_sym`,
`match[:format]&.to_sym`, `match[:variant]&.to_sym`.

trails#8129 converged the format capture (`":html"`), but
`packages/actionview/src/template/resolver.ts`'s `parse` still passes
locale, handler and variant as bare strings (`"en"`, `"tse"`, `"phone"`), and
`LookupContext`'s `registerDetail` defaults (`lookup-context.ts`, `["en"]`,
`TemplateHandlers.extensions()`) match them bare, where Rails' are Symbols
(`lookup_context.rb:49-52`).

## Converged shape

`parse` applies `to_sym` (colon spelling) to all four captures; the
locale/handlers/variants detail defaults and every `Requested` input are
colon-spelled Symbols, so `TemplateDetails#matches?` compares Symbols to
Symbols as Rails does. Coordinate with `missing-template-details-values-symbol-spelling`,
which fixes the same values at the `MissingTemplate` inspect site.

## Acceptance criteria

- `PathParser#parse` yields `TemplateDetails` whose locale/handler/variant are
  `":en"` / `":tse"` / `":phone"`.
- actionview and actionpack suites green with the Symbol-spelled details.
