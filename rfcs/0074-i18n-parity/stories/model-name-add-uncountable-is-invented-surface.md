---
title: "ModelName.addUncountable is invented surface over Inflections#uncountable"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6176
claim: "2026-08-07T15:54:17Z"
assignee: "i18n-load-yml-json-take-the-psych4-arm"
blocked-by: null
closed-reason: null
---

## Context

`ModelName.addUncountable(word)` (`packages/activemodel/src/naming.ts`) is
invented surface — Rails has no `ActiveModel::Name.add_uncountable`. Registering
an uncountable in Rails goes through the inflector store:

```ruby
ActiveSupport::Inflector.inflections(locale) { |inflect| inflect.uncountable(word) }
```

(activesupport/lib/active*support/inflector/inflections.rb, `Inflections#uncountable`;
`ActiveModel::Name` only ever \_reads* that store, via
`ActiveSupport::Inflector.pluralize(@singular, locale)` at
activemodel/lib/active_model/naming.rb:180.)

The trails method is a thin wrapper over exactly that
(`Inflections.instance("en").uncountable(word)`) and it hardcodes `"en"` — which
is now the last hardcoded locale in the file, since #6112 threaded the `locale`
argument through `initialize`, `_uncountables`, `pluralize` and `singularize`.

Call sites are `packages/activemodel/src/naming.test.ts` only (three uses).

## Converged shape

`ModelName.addUncountable` deleted; its callers reach
`Inflections.instance(locale).uncountable(word)` from `@blazetrails/activesupport`
directly, which is the Rails spelling.

## Acceptance criteria

- [ ] `ModelName.addUncountable` is gone, not merely locale-parameterized.
- [ ] naming_test.rb-derived tests keep their names verbatim and register
      uncountables through the inflector store.
- [ ] `pnpm parity:api:extra --package activemodel` loses the corresponding novel name.
