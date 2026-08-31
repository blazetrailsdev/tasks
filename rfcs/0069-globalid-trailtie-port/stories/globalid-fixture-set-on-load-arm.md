---
title: "globalid: port GlobalID::FixtureSet and the on_load(:active_record_fixture_set) arm"
status: draft
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/globalid/lib/global_id/railtie.rb:41-42` ends the `global_id`
initializer with a second load-hook arm:

```ruby
ActiveSupport.on_load(:active_record_fixture_set) do
  require 'global_id/fixture_set'
  send :extend, GlobalID::FixtureSet
end
```

`packages/globalid/src/trailtie.ts` (PR #7297) ports every other arm of that
initializer but not this one: `GlobalID::FixtureSet`
(`vendor/globalid/lib/global_id/fixture_set.rb`) has no TS counterpart, and
nothing runs an `active_record_fixture_set` load hook. The gap is recorded in
the Trailtie's JSDoc.

`FixtureSet#signed_global_id` is what lets a fixture write
`gid: <%= ActiveRecord::FixtureSet.signed_global_id "users/dhh" %>`.

## Acceptance criteria

- [ ] Port `global_id/fixture_set.rb` to `packages/globalid/src/fixture-set.ts`
      — `signedGlobalId(fixtureSetName, label, column:, **options)` mirroring
      the Ruby method, names and argument order included.
- [ ] `FixtureSet` (`packages/activerecord/src/fixture-set.ts`) runs an
      `active_record_fixture_set` load hook, and globalid's Trailtie extends it
      from that hook exactly as `railtie.rb:41-42` does.
- [ ] Port the corresponding Rails cases if `vendor/globalid/test` has them;
      test names verbatim.
