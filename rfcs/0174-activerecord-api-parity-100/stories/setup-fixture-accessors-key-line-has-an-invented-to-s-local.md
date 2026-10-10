---
title: "activerecord: setup_fixture_accessors' key line calls to_s with no invented local"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from trails#8732. Rails' key line in
`TestFixtures::ClassMethods#setup_fixture_accessors`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:79`) is

```ruby
key = fs_name.to_s.include?("/") ? -fs_name.to_s.tr("/", "_") : fs_name
```

`setupFixtureAccessors` (`packages/activerecord/src/test-fixtures.ts`) ports the
two `to_s` calls through a local and a conditional Rails does not have:

```ts
const name = isSymbol(fsName) ? symbolToS(fsName) : fsName;
let key = name.includes("/") ? strUminus(name.replaceAll("/", "_")) : fsName;
```

because ruby-compat has no `to_s` that answers a colon-Symbol's name and a
String unchanged. `symbol-to-s-interpolation-has-one-ruby-compat-spelling`
(RFC 0154) owns that spelling.

## Acceptance criteria

- [ ] The key line calls the one ruby-compat `to_s` spelling at both sites
      where `test_fixtures.rb:79` calls `to_s`, with no `name` local and no
      `isSymbol` conditional on that line.
- [ ] `test-fixtures.trails.test.ts`'s "setup_fixture_accessors keys a Symbol
      set name by its String" still passes.
