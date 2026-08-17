---
title: "Converge Model.validates onto Rails' generic validator lookup"
status: draft
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while measuring `assertions-activemodel-validates-test` (PR #6625).

`Model.validates` (`packages/activemodel/src/model.ts:561-655`) is a hardcoded
chain — `if (rules.presence) … if (rules.length) … if (rules.comparison) …` —
one arm per built-in validator, with the shared `allowNil`/`allowBlank` merge
open-coded inside each arm. Rails' `validates`
(`vendor/rails/activemodel/lib/active_model/validations/validates.rb:105-124`)
is generic and much shorter:

```ruby
def validates(*attributes)
  defaults = attributes.extract_options!.dup
  validations = defaults.slice!(*_validates_default_keys)
  ...
  validations.each do |key, options|
    key = "#{key.to_s.camelize}Validator"
    begin
      validator = const_get(key)
    rescue NameError
      raise ArgumentError, "Unknown validator: '#{key}'"
    end
    next unless options
    validates_with(validator, defaults.merge(_parse_validates_options(options)))
  end
end
```

Three behaviours follow from that shape and are absent in trails:

- **Lookup by option key.** `validates :karma, email: true` resolves
  `EmailValidator`; `'namespace/email': true` resolves
  `Namespace::EmailValidator`. trails has no registry, so a model-defined or
  app-defined validator cannot be named by key at all — only `validatesWith`
  works.
- **`ArgumentError` on an unknown key** — `"Unknown validator: 'UnknownValidator'"`,
  raised for a falsy option value too (`unknown: false` raises before the
  `next unless options` guard). trails silently ignores the key.
- **`_validates_default_keys`** (validates.rb:126-128) and its model-level
  override, plus `_parse_validates_options` (validates.rb:158-169) — the
  shorthands `format: /re/`, `inclusion: %w(a b)`, `length: 6..20`,
  `numericality: true`.

## Converged shape

Port `validates` as Rails writes it, with `_validates_default_keys` and
`_parse_validates_options` extracted as Rails extracts them. The one piece with
no literal TS twin is `const_get("#{key.to_s.camelize}Validator")` — Ruby
constant lookup off the model's namespace. Settle that spelling first (a
registry keyed by the camelized name, populated by the built-in validators and
extensible by a model, is the likely answer) and justify it at the call site.

## Acceptance criteria

- `validates` mirrors validates.rb:105-124 — same locals, same branch order,
  same `ArgumentError` class and message string.
- `_validates_default_keys` and `_parse_validates_options` exist at the Rails
  names and are overridable by a model, as `test/models/topic.rb:11-13` does.
- A validator named by option key resolves, including a namespaced one.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; no new baseline
  rows.
- Unblocks `assertions-activemodel-validates-test`.
