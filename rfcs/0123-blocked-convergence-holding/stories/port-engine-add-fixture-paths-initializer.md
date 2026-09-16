---
title: "Port Engine's add_fixture_paths initializer and fixtures_in_root_and_not_in_vendor_or_dot_dir?"
status: blocked
updated: 2026-09-04
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 20
pr: null
claim: "2026-09-04T20:50:46Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "Blocked on ActiveRecord::TestFixtures: the initializer's body needs the :active_record_fixtures load hook and a fixture_paths class_attribute, both of which come from ActiveSupport.run_load_hooks(:active_record_fixtures, self) inside test_fixtures.rb:20-40's included block. trails has no TestFixtures concern — packages/activerecord/src/test-fixtures.ts is a vitest fixtures helper, not a port of that module — so there is nothing for on_load(:active_record_fixtures) to fire on and nothing that owns fixture_paths (git grep 'fixture_paths|fixturePaths|active_record_fixtures' over packages/ returns nothing). Port ActiveRecord::TestFixtures first; Engine#fixtures_in_root_and_not_in_vendor_or_dot_dir? (engine.rb:741-745) and the add_fixture_paths initializer (engine.rb:629-636) are then a small follow-on."
closed-reason: null
---

## Context

`Engine`'s `add_fixture_paths` initializer
(`vendor/rails/railties/lib/rails/engine.rb:629-636`) was left undeclared by
PR #7332 and is recorded in `packages/trailties/src/engine.ts`'s header comment:

```ruby
initializer :add_fixture_paths do
  next if is_a?(Rails::Application)

  fixtures = config.root.join("test", "fixtures")
  if fixtures_in_root_and_not_in_vendor_or_dot_dir?(fixtures)
    ActiveSupport.on_load(:active_record_fixtures) { self.fixture_paths |= ["#{fixtures}/"] }
  end
end
```

The prerequisite the earlier blocker named, an `ActiveRecord::TestFixtures`
concern that owns `fixture_paths` and runs the `:active_record_fixtures` hook, is
ported now. It mirrors `test_fixtures.rb:20-40`:

- `packages/activerecord/src/test-fixtures.ts:109` is
  `classAttribute.call(base, "fixturePaths", { instanceWriter: false, default: [] })`.
- `:118` calls `runLoadHooks("active_record_fixtures", base)`.

`onLoad` from `@blazetrails/activesupport` is already used by `add_view_paths` in
`engine.ts`.

Still missing, as measured on trails `0236d460b2` (`engine.ts` has no
`fixturePaths` or `fixturesInRoot` reference):

- the `add_fixture_paths` initializer;
- `Engine#fixtures_in_root_and_not_in_vendor_or_dot_dir?` (private,
  `engine.rb:741-745`). It is already listed under `packages/trailties/src/engine.ts`
  in `eslint/rails-private-methods.json`.

The `|=` is an order-preserving de-duplicating union, and the appended path
carries a trailing slash (`"#{fixtures}/"`).

## Acceptance criteria

- `Engine#fixturesInRootAndNotInVendorOrDotDir` is ported at its Rails name in
  Rails' private section, carrying `@internal`.
- `Engine` declares `add_fixture_paths` at its Rails name, in Rails declaration
  order (after `add_mailer_preview_paths` at `engine.rb:622`, before
  `prepend_helpers_path` at `:638`), with Rails' body including the
  `next if is_a?(Rails::Application)` early return. The hook unions onto
  `fixturePaths`.
- `:add_fixture_paths` is removed from `engine.ts`'s not-declared header comment.
