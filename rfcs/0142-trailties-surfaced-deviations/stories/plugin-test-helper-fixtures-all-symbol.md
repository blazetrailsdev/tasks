---
title: 'Plugin test helper template calls fixtures("all") instead of fixtures(":all")'
status: draft
updated: 2026-11-13
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The plugin generator's test helper template (`packages/trailties/lib/generators/trails/plugin/templates/test/test_helper.ts.tt:24`) emits `ActiveSupport.TestCase.fixtures("all")`. Rails' template emits `ActiveSupport::TestCase.fixtures :all` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/templates/test/test_helper.rb.tt:19`).

`TestFixtures::ClassMethods#fixtures` loads every set only for the Symbol `:all` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:56`). trails spells that Symbol `":all"` (`packages/activerecord/lib/test-fixtures.ts`, the `fixtureSetNames[0] === ":all"` arm). So the plugin's `"all"` names a single set called `all`. A generated engine loads no fixtures, and trails-tsc types no accessors for it (trails#10073).

## Acceptance criteria

- [ ] The plugin test helper template emits `ActiveSupport.TestCase.fixtures(":all")`.
- [ ] The plugin generator test asserts the generated `test/test-helper.ts` contains `fixtures(":all")`.
