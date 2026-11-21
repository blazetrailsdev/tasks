---
title: "trailties-railtie-class-names-match-rails"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/railties/engine_test.rb:1533-1554` ("setting priority for engines with
config.railties_order") asserts `Rails.application.send(:ordered_railties).flatten.map(&:class).map(&:name)`
equals the full railtie list. In trails (`packages/trailties/test/trailties/engine.test.ts`, ported in trails#10522)
`rbModName` answers wrong names for several framework railties, so the port can only assert the tail
(`BukkitsEngine`, `AppTemplate`, `BlogEngine`). Observed list on 2026-11-21:

`Trailtie, ActiveSupport::Railtie, ActionDispatch::Railtie, ActiveModel::Railtie, ActionView::Railtie,
ActionController::Railtie, ActiveRecord::Railtie, GlobalID::Railtie, ActiveJob::Railtie, ActionMailer::Railtie,
Trails::TestUnitRailtie, Engine, ActionCable::Engine, Engine, Engine, BukkitsEngine, AppTemplate, BlogEngine`

Gaps against Rails' list (Propshaft / Importmap dropped, out of scope):

- `I18n::Railtie` answers `Trailtie`.
- `ActiveStorage::Engine`, `ActionMailbox::Engine`, `ActionText::Engine` answer `Engine` (not seated in their packages' class-path tables).
- The generated app class answers `AppTemplate`, where Rails answers `AppTemplate::Application`.
- `ActionView::Railtie` sorts before `ActionController::Railtie`; Rails loads it after `Rails::TestUnitRailtie`.

## Acceptance criteria

- [ ] Each railtie above answers its Rails name through `rbModName`.
- [ ] The port's assertion is the full Rails list (Propshaft/Importmap removed), as `engine_test.rb:1533` asserts it.
