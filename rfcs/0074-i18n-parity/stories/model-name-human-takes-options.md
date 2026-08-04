---
title: "ModelName#human takes options in Rails; ours is a getter that drops them"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6094
claim: "2026-08-04T21:35:01Z"
assignee: "model-name-human-takes-options"
blocked-by: null
closed-reason: null
---

# `ModelName#human` takes options in Rails; ours is a getter that drops them

## Context

`packages/activemodel/src/naming.ts` exposes `human` as a getter:

```ts
get human(): string {
```

Rails' is a method with an options hash
(`vendor/rails/activemodel/lib/active_model/naming.rb:human`):

```ruby
def human(options = {})
  return @human if i18n_keys.empty? || i18n_scope.empty?
  key, *defaults = i18n_keys
  defaults << options[:default] if options[:default]
  defaults << MISSING_TRANSLATION
  translation = I18n.translate(key, scope: i18n_scope, count: 1, **options, default: defaults)
  translation = @human if translation == MISSING_TRANSLATION
  translation
end
```

So callers can pass `count:` for a pluralized model name, `locale:`,
interpolation values, and a `default:` that joins the lookup chain ahead of the
`@human` fallback. None of that is reachable through a getter. PR 6026 ported
the body faithfully — Symbol defaults, the `MISSING_TRANSLATION` sentinel, the
`scope:`/`count: 1` pair — but had to hard-code `count: 1` and drop `options`
entirely because there is nowhere to put them.

This is not a TypeScript shortcoming: a method is the direct spelling, and
`Person.modelName.human` becoming `Person.modelName.human()` is the only
call-site cost.

## Acceptance criteria

- `ModelName#human` becomes `human(options = {})` and threads `options` into
  `I18n.translate` exactly as naming.rb does, including
  `defaults << options[:default]`.
- Call sites across `packages/` are updated; `Errors#full_message` /
  `generate_message` keep passing what Rails passes.
- `activemodel/test/cases/naming_test.rb`'s `human` cases pass with names
  untouched, and a case covering `human(count: 2)` and `human(default: ...)` is
  ported alongside if Rails has one.
