---
title: "activesupport: NumberConverter::DEFAULTS is one Symbol-keyed Hash, as number_converter.rb:14-118"
status: draft
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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
closed-reason: null
---

## Context

Since trails#8992 the i18n translations store is a ruby-compat `Hash`. Translation data that meets it has to be a `Hash` too. activesupport's `NumberConverter::DEFAULTS` (`packages/activesupport/src/number-helper/number-converter.ts:14-69`) is still a plain object. The exception is `storage_units.units.byte`, now a `Hash` with `":one"` / `":other"` keys, because `pluralize` (`i18n/backend/base.rb:182-189`) reads it as a Hash when it reaches I18n as the `default:` of `translate_number_value_with_default` (`vendor/rails/v8.0.2/activesupport/lib/active_support/number_helper/number_converter.rb:166-176`).

In Rails, `DEFAULTS` is one Symbol-keyed Hash constant (`number_converter.rb:14-118`), and `default_value(key)` walks it with `defaults[k.to_sym]`. trails is half plain and half `Hash`. Any other DEFAULTS subtree handed to I18n as a `default:` with `count:` would also fail to pluralize.

## Acceptance criteria

- [ ] Every DEFAULTS subtree that `default_value` can hand to `I18n.translate` as translation data has Rails' shape: a `Hash` keyed by `":name"`, or a separate split between format options and translation data that is documented against `number_converter.rb:14-118`.
- [ ] `default_value` mirrors `key.split(".").reduce(DEFAULTS) { |defaults, k| defaults[k.to_sym] }`.
- [ ] The number-helper tests pass with an empty i18n store, which exercises the defaults path.
