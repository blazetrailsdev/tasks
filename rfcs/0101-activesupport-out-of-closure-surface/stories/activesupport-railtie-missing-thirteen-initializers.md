---
title: "ActiveSupport::Railtie ports 3 of 16 initializers, so config.beginning_of_week and 12 siblings are inert"
status: draft
updated: 2026-09-08
rfc: "0101-activesupport-out-of-closure-surface"
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

Surfaced in PR #7624, which converged `Rails::Application::Configuration`'s
`beginning_of_week` default onto Rails' `:monday` Symbol
(`vendor/rails/railties/lib/rails/application/configuration.rb:53`) and found
that the field is inert: nothing in the tree ever reads
`config.beginningOfWeek`, and `setBeginningOfWeekDefault` /
`setBeginningOfWeek` (`packages/activesupport/src/core-ext/date/calculations.ts`)
have no production callers at all.

The reason is that `ActiveSupport::Railtie`'s initializers are only partly
ported. `vendor/rails/activesupport/lib/active_support/railtie.rb` declares 16
initializers; `packages/trailties/src/trailties/active-support.ts` declares 3
(`active_support.deprecator`, `active_support.deprecation_behavior`,
`active_support.set_hash_digest_class`). The missing one this PR tripped over is
`railtie.rb:107-112`:

```ruby
initializer "active_support.initialize_beginning_of_week" do |app|
  require "active_support/core_ext/date/calculations"
  beginning_of_week_default = Date.find_beginning_of_week!(app.config.beginning_of_week)

  ActiveSupport.on_load(:active_support_test_case) { ... }
  Date.beginning_of_week_default = beginning_of_week_default
end
```

so `Date.beginning_of_week` never picks up the application's configured week
start. The other 12 absent initializers are the same class of gap:
`isolation_level` (`:16`), `raise_on_invalid_cache_expiration_time` (`:24`),
`set_authenticated_message_encryption` (`:32`), `reset_execution_context`
(`:41`), `reset_all_current_attributes_instances` (`:47`),
`initialize_time_zone` (`:88`), `to_time_preserves_timezone` (`:99`),
`require_master_key` (`:114`), `set_configs` (`:125`),
`set_key_generator_hash_digest_class` (`:140`),
`set_default_message_serializer` (`:148`),
`set_use_message_serializer_for_metadata` (`:156`).

Each is a config field that silently does nothing today.

## Converged shape

- `active-support.ts` declares each missing initializer with Rails' exact
  string name, in Rails' source order, with the same `before:` / `after:`
  options where `railtie.rb` gives them, and each body ported from its Rails
  counterpart.
- `initialize_beginning_of_week` in particular routes
  `app.config.beginningOfWeek` through `findBeginningOfWeekBang` into
  `setBeginningOfWeekDefault`, which is what those two already-ported functions
  exist to serve.
- Split per initializer if this exceeds one PR — the acceptance criteria below
  are per-initializer and the ordering between them is Rails' file order, not a
  dependency.

## Acceptance criteria

- [ ] Every initializer in `railtie.rb` has a counterpart in
      `active-support.ts` at the same name, or a story of its own recording why
      it cannot land yet.
- [ ] `config.beginningOfWeek` reaches `Date.beginningOfWeek` through
      `initialize_beginning_of_week`, pinned by a boot test.
- [ ] `pnpm parity:api` shows no regression for `activesupport/railtie.rb`.
