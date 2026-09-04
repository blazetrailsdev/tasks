---
title: "Port Engine's add_fixture_paths initializer and fixtures_in_root_and_not_in_vendor_or_dot_dir?"
status: claimed
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 20
pr: null
claim: "2026-09-04T20:50:46Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

`Engine`'s `add_fixture_paths` initializer (`engine.rb:629-636`) was left
undeclared by PR #7332 and recorded in `packages/trailties/src/engine.ts`'s
header comment:

```ruby
initializer :add_fixture_paths do
  next if is_a?(Rails::Application)

  fixtures = config.root.join("test", "fixtures")
  if fixtures_in_root_and_not_in_vendor_or_dot_dir?(fixtures)
    ActiveSupport.on_load(:active_record_fixtures) { self.fixture_paths |= ["#{fixtures}/"] }
  end
end
```

Two pieces are missing on the trails side:

- The `:active_record_fixtures` load hook. `onLoad`/`runLoadHooks` from
  `@blazetrails/activesupport` already exist and are used by `add_view_paths`
  in the same file, so this is a matter of ActiveRecord's fixtures surface
  running the hook and exposing `fixture_paths`.
- `Engine#fixtures_in_root_and_not_in_vendor_or_dot_dir?` (private,
  `engine.rb:697+`). It is already present in
  `eslint/rails-private-methods.json` under
  `packages/trailties/src/engine.ts`, so the privates manifest expects it —
  it just is not written yet.

Note the `|=` is a union that de-duplicates while preserving order, and the
appended path carries a trailing slash (`"#{fixtures}/"`).

## Converged shape

- `Engine#fixturesInRootAndNotInVendorOrDotDir` is ported at its Rails name in
  Rails' private section, carrying `@internal` (it is in the privates manifest,
  unlike `load_config_initializer`, which carries `# :doc:`).
- `Engine` declares `add_fixture_paths` at its Rails name, in Rails declaration
  order (between `add_mailer_preview_paths` at `engine.rb:622` and
  `prepend_helpers_path` at `:638`), with Rails' body including the
  `next if is_a?(Rails::Application)` early return.
- The `:add_fixture_paths` entry is removed from `engine.ts`'s
  deliberately-not-declared header comment.
