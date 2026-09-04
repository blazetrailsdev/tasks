---
title: "Port Engine's add_locales initializer (needs config.i18n.railties_load_path)"
status: blocked
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: null
claim: "2026-09-04T20:50:46Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "Blocked on I18n::Railtie. config.i18n is not an EngineConfiguration member in Rails: activesupport/lib/active_support/i18n_railtie.rb:10-11 sets config.i18n = ActiveSupport::OrderedOptions.new and config.i18n.railties_load_path = [] in the I18n::Railtie class body, so it lands in Railtie::Configuration's shared @@options bag (railtie/configuration.rb:143-166) and every railtie config sees it. trails has no I18n::Railtie — no file under packages/ ports i18n_railtie.rb — and activesupport cannot host one because it would have to subclass Trailtie from @blazetrails/trailties, which activesupport does not (and cannot circularly) depend on. Putting an i18n bag on EngineConfiguration instead, as this story's converged shape suggests, would ratify an invented location rather than converge. Port I18n::Railtie (deciding its package first) and then add_locales (engine.rb:610-612) is the stated one-liner."
closed-reason: null
---

## Context

`Engine`'s `add_locales` initializer is the one remaining path-registering
initializer in `engine.rb:610-612` that `packages/trailties/src/engine.ts` does
not declare (PR #7332 recorded it in that file's header comment):

```ruby
# I18n load paths are a special case since the ones added
# later have higher priority.
initializer :add_locales do
  config.i18n.railties_load_path << paths["config/locales"]
end
```

It is blocked only on `config.i18n`: `EngineConfiguration`
(`packages/trailties/src/engine/configuration.ts`) has no `i18n` options bag, so
there is no `railties_load_path` to push onto. The path entry itself already
exists — `paths.add("config/locales", { glob: "**/*.{ts,js,json}" })`
(`engine/configuration.ts`), mirroring `engine/configuration.rb:98`.

Note the Rails comment: the collection is order-sensitive (later entries win),
so `railties_load_path` must stay an append-ordered list, not a set.

## Converged shape

- `EngineConfiguration` gains an `i18n` options bag carrying
  `railtiesLoadPath`, mirroring Rails'
  `config.i18n = ActiveSupport::OrderedOptions.new`.
- `Engine` declares `add_locales` at its Rails name, in Rails declaration order
  (between `add_routing_paths` at `engine.rb:595` and `add_view_paths` at
  `:614`), with Rails' one-line body and its `# I18n load paths are a special
case` comment preserved.
- The `:add_locales` entry is removed from `engine.ts`'s
  deliberately-not-declared header comment.
- Relates to `read-available-locales-from-i18n-in-lookup-and-pathparser` in this
  RFC and to RFC 0074 (i18n parity).
