---
title: "framework-onload-hooks-see-config-initializers"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps:
  - framework-class-load-hooks-fire-after-app-initializers
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-24T02:59:56Z"
assignee: "activestorage-index-import-loads-blob-eagerly"
blocked-by: null
closed-reason: null
---

## Context

Rails' framework `set_configs`-style initializers run their body inside
`ActiveSupport.on_load(:action_controller)` / `on_load(:active_record_encryption)`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_controller/railtie.rb` "action_controller.set_configs",
`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb` "active_record_encryption.configuration").
In Rails the framework class is not loaded until after `load_config_initializers`, so a value set in
`config/initializers/*.rb` is seen. In trails `ActionController::Base` and `ActiveRecord::Encryption`
are loaded by ES import before boot, so `onLoad` fires immediately inside the initializer
(`packages/trailties/lib/trailties/action-controller.ts` ~line 95, `packages/trailties/lib/trailties/active-record.ts` ~line 419),
before the app's initializers run, and their config writes are lost.

Unported because of this (`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb`):

- "ActionController::Base.raise_on_missing_callback_actions can be configured in the new framework defaults"
- "allows initializer to set active_record_encryption.configuration"

## Acceptance criteria

- Config set in `config/initializers/` reaches these load hooks as in Rails.
- Both tests ported into `packages/trailties/test/application/configuration.test.ts` with Rails names and pass.
