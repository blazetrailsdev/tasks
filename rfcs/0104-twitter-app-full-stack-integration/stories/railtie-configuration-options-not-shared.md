---
title: "railtie-configuration-options-not-shared"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Railtie::Configuration`'s option bag is a class variable shared by every
instance: `@@options ||= {}` in `initialize`
(`railties/lib/rails/railtie/configuration.rb:8-9`), read and written through
`method_missing` / `respond_to?` (`:90-108`).

That sharing is load-bearing. A framework railtie's class body runs
`config.active_record = ActiveSupport::OrderedOptions.new`
(`activerecord/lib/active_record/railtie.rb:32`) against
`ActiveRecord::Railtie.config`, and the application later reads
`app.config.active_record` off its own `Application::Configuration` instance —
the same `@@options` hash.

trails' port holds the bag per instance:
`private readonly _options: Record<string, unknown> = {}`
(`packages/trailties/src/trailtie/configuration.ts`). So a framework railtie's
config is invisible to the application's own config object, and the two see
different bags.

## Converged shape

`_options` becomes class-level, shared by every `Configuration` instance
(including the `Engine::Configuration` and `Application::Configuration`
subclasses, as in Ruby, where `@@` is shared down the hierarchy), and `get` /
`set` / `respondTo` read it off the class rather than the instance.

Built and verified once in PR #7386, closed unmerged for an unrelated reason;
that diff is a working reference. Note it also required
`application.test.ts`'s "config.load_defaults skips a framework that has not
registered its config" case to assert against a framework that genuinely never
registers (`activeJob`), because once the bag is shared, a loaded ActiveRecord
railtie has legitimately populated `activeRecord` — which is Rails' behaviour
too.

## Acceptance criteria

- [ ] `new Configuration().get(k)` sees a value set on another instance, per
      `configuration.rb:8-9`.
- [ ] A framework railtie's `config.set("activeRecord", …)` is readable off an
      `Application`'s own config.
- [ ] Existing `RailtieTest` / `Application::Configuration` case names unchanged.
