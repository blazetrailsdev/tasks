---
title: "eager-load-namespaces-without-eager-load-bang"
status: done
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: trails#8104
claim: "2026-09-25T19:40:38Z"
assignee: "eager-load-namespaces-without-eager-load-bang"
blocked-by: null
closed-reason: null
---

## Context

`Finisher`'s `eager_load!` initializer
(`packages/trailties/src/application/finisher.ts`, `application/finisher.rb:76-87`)
calls `namespace.eagerLoadBang()` on every entry of `config.eagerLoadNamespaces`.
Two railties push namespaces that have no `eagerLoadBang`:

- `trailties/global-id.ts` pushes `GlobalID` (`vendor/globalid/lib/global_id/railtie.rb:14`).
  Rails' `GlobalID` does `extend ActiveSupport::Autoload`
  (`vendor/globalid/lib/global_id.rb`), but trails' `GlobalID` class has no
  `eagerLoadBang`.
- `trailties/active-model.ts` pushes the `@blazetrails/activemodel` module
  namespace (`activemodel/lib/active_model/railtie.rb:8`). Rails' `ActiveModel`
  is `extend ActiveSupport::Autoload` with `def self.eager_load!` calling
  `super` and then `ActiveModel::Serializers.eager_load!` (`active_model.rb:76-80`).
  trails has no `ActiveModel` namespace object.

So an app with `config.eagerLoad = true` that loads either trailtie gets a
`TypeError` from the finisher.

## Acceptance criteria

- `GlobalID` and `ActiveModel` each answer `eagerLoadBang()` the way
  `activerecord/src/namespaces.ts` / `active-record.ts:432` do for ActiveRecord.
  ActiveModel gets an `Autoload`-extended namespace object, mirroring `active_model.rb`.
- A finisher test boots with `eagerLoad = true` and both trailties loaded.
