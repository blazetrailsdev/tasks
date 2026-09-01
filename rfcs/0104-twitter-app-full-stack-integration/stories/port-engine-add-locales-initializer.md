---
title: "Port Engine's add_locales initializer (needs config.i18n.railties_load_path)"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
