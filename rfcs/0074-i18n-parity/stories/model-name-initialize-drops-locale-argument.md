---
title: "ModelName#initialize drops Rails' locale argument and its locale-aware pluralize"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6112
claim: "2026-08-05T01:59:57Z"
assignee: "i18n-date-rewrite-frags-and-new-by-frags-fast-path"
blocked-by: null
closed-reason: null
---

# `ModelName#initialize` drops Rails' `locale` argument and its locale-aware pluralize

## Context

Found while converging `ModelName#human` in #6105.

`ActiveModel::Name#initialize`
(vendor/rails/activemodel/lib/active_model/naming.rb:166-185) takes a fourth
argument and threads it into pluralization:

```ruby
def initialize(klass, namespace = nil, name = nil, locale = :en)
  ...
  @singular     = _singularize(@name)
  @plural       = ActiveSupport::Inflector.pluralize(@singular, locale)
  @uncountable  = @plural == @singular
```

`packages/activemodel/src/naming.ts` has no `locale` parameter at all, and calls
`pluralize(this.singular)` with no locale. Every downstream field derived from
`@plural` — `plural`, `uncountable`, `collection`, `routeKey`,
`singularRouteKey` — is therefore always English, regardless of the locale the
model is being named under. `ActiveSupport::Inflector.pluralize` is genuinely
locale-aware (`inflections(locale)`), and trails' `Inflections.instance(locale)`
already models that store, so the capability exists — only the threading is
missing.

Note `ModelName._uncountables` already hardcodes `Inflections.instance("en")`
for the same reason; it is the same gap in a second place.

## Converged shape

- Add the `locale` parameter with Rails' default (`"en"`) and thread it through
  `pluralize(this.singular, locale)`, matching naming.rb:180.
- Thread it through the uncountable lookup too, so `_uncountables` consults
  `Inflections.instance(locale)` rather than the hardcoded `"en"` store.
- Keep the trails options-object shape for `namespace`/`klass` (that deviation
  is language-forced by Ruby's `::` and already justified at the call site);
  this story is only about the missing locale, not re-litigating the signature.

## Acceptance criteria

- [ ] `ModelName` accepts a locale defaulting to `"en"` and uses it for both
      `pluralize` and the uncountable lookup.
- [ ] A model named under a non-`en` locale with locale-specific inflections
      gets that locale's `plural` / `collection` / `routeKey`.
- [ ] naming_test.rb cases pass with names untouched.
