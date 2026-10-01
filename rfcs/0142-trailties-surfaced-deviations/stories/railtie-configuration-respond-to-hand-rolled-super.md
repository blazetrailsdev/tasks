---
title: "Railtie::Configuration#respond_to? hand-rolls super and drops include_private"
status: draft
updated: 2026-10-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Railtie::Configuration#respond_to?`
(`vendor/rails/v8.0.2/railties/lib/rails/railtie/configuration.rb:90-92`) is

    def respond_to?(name, include_private = false)
      super || @@options.key?(name.to_sym)
    end

trails' `isRespondTo(key)` (`packages/trailties/src/trailtie/configuration.ts:114-122`)
takes one parameter named `key`, and replaces `super` with a hand-rolled walk:
own properties, then each prototype, skipping any name that starts with `_`.
trails#8339 added the own-property arm because `Engine::Configuration`'s
`attr_accessor :default_scope` is an instance field and
`RouteSet.new_with_config` (`route_set.rb:377-379`) asks
`config.respond_to?(:default_scope)`.

A direct port, `basicObjRespondTo(this, name, !includePrivate) || …`, was tried
there and reverted: it answers TS-only private members (`_actualMethod`,
`_options`), which reds `configuration.trails.test.ts`'s "stores a key naming
TS-only implementation surface" — `method_missing`'s `actual_method?` arm
(`configuration.rb:95-104`) then refuses to store such a key.

## Acceptance criteria

- `isRespondTo(name, includePrivate = false)` carries Rails' parameters and is
  `super || options.key?`: the `super` half goes through ruby-compat's
  `basicObjRespondTo`, not a local prototype walk.
- The TS-only members that walk has to hide are real privates (`#x` or
  module-level state) so no name-prefix rule is needed.
- `configuration.trails.test.ts` stays green.
