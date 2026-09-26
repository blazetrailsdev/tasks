---
title: "LookupContext#locale= never writes I18n.config.locale"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: ["lookup-context-locale-detail-follows-i18n"]
deps-rfc: []
est-loc: 40
priority: 10
pr: trails#8147
claim: "2026-09-26T18:02:02Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails' `LookupContext#locale=`
(`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:290-297`) looks like this:

```ruby
def locale=(value)
  if value
    config = I18n.config.respond_to?(:original_config) ? I18n.config.original_config : I18n.config
    config.locale = value
  end
  super(default_locale)
end
```

Setting a view's locale writes `I18n.config.locale` and then re-reads the detail from the registered default, which now reads I18n (trails#8135).

trails' setter (`packages/actionview/src/lookup-context.ts`, `set locale`) stores `[value]` straight into the detail, or the default proc's value when the argument is null. It never touches `I18n`. So `view.locale = "da"` does not change `I18n.locale`, and the locale fallbacks of the `locale` detail are skipped.

## Acceptance criteria

- `set locale(value)` writes `I18n.config().locale` when the value is present, using the `original_config` arm when the config answers it. It then sets the detail from the default proc, as at `lookup_context.rb:290-297`.
- A test shows that setting `lookupContext.locale = "da"` makes `I18n.locale()` answer `"da"` and the detail include the default locale.
