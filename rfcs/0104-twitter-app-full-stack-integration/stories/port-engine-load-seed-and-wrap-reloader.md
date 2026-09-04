---
title: "Port Engine#load_seed and its wrap_reloader_around_load_seed initializer"
status: done
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 20
pr: 7493
claim: "2026-09-04T19:50:50Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`Engine#load_seed` and its `:load_seed` callback chain are unported, so
`Engine`'s `wrap_reloader_around_load_seed` initializer
(`engine.rb:650-654`) has nothing to wrap and was left undeclared by PR #7332
(recorded in `packages/trailties/src/engine.ts`'s header comment).

Rails, `engine.rb:559-563`:

```ruby
def load_seed
  seed_file = paths["db/seeds.rb"].existent.first
  run_callbacks(:load_seed) { load(seed_file) } if seed_file
end
```

and `engine.rb:650-654`:

```ruby
initializer :wrap_reloader_around_load_seed do |app|
  self.class.set_callback(:load_seed, :around) do |engine, seeds_block|
    app.reloader.wrap(&seeds_block)
  end
end
```

Trails-side state:

- The path entry exists: `paths.add("db/seeds.ts")`
  (`packages/trailties/src/engine/configuration.ts`), mirroring
  `engine/configuration.rb:103`.
- `Application#reloader` exists (`packages/trailties/src/application.ts:49`,
  `Class.new(ActiveSupport::Reloader)` per `application.rb:123`), so the
  `app.reloader.wrap` half has a receiver.
- The `:load_seed` callback chain is defined by `Engine`'s
  `define_callbacks :load_seed` — check whether `Trailtie`/`Engine` already
  mixes in the ActiveSupport callbacks surface before adding one.

Ruby's `load(seed_file)` is `import()` here, so `loadSeed` is async — the same
translation `load_config_initializer` took in PR #7332
(`packages/trailties/src/engine.ts`).

## Acceptance criteria

- `Engine#load_seed` is ported at its Rails name with Rails' body and its
  `db/seeds` path lookup, plus the `:load_seed` callback chain it runs through.
- `Engine` declares `wrap_reloader_around_load_seed` at its Rails name, in Rails
  declaration order (between `load_config_initializers` at `engine.rb:644` and
  `engines_blank_point` at `:656`), with Rails' body.
- The `:wrap_reloader_around_load_seed` entry is removed from `engine.ts`'s
  deliberately-not-declared header comment.
