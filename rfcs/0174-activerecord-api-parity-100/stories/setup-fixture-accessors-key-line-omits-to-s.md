---
title: "activerecord: setup_fixture_accessors' key line calls to_s where Rails does"
status: closed
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
closed-reason: "FALSIFIED: fixed in trails#8732 before merge; the key line reads the set name through to_s"
---

## Context

Surfaced reviewing trails#8732, which ported the two `is_a?(Symbol)` arms of
`TestFixtures::ClassMethods#setup_fixture_accessors`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:72-83`).

Rails' key line is

```ruby
key = fs_name.to_s.include?("/") ? -fs_name.to_s.tr("/", "_") : fs_name
```

`setupFixtureAccessors` (`packages/activerecord/src/test-fixtures.ts`) calls
`fsName.includes("/")` and `fsName.replaceAll("/", "_")` with no `to_s`. For a
Symbol name (`":admin/users"`) the ternary answers `":admin_users"`, and the
`isSymbol(key)` arm on the next line strips the colon, so the stored key is
right, but by a different route than Rails takes, and the two `to_s` calls are
omitted.

## Acceptance criteria

- [ ] The key line calls the ruby-compat `to_s` that answers a Symbol's name
      (`symbolToS` for a Symbol, the string itself otherwise) at both sites
      where `test_fixtures.rb:79` calls `to_s`.
- [ ] `test-fixtures.trails.test.ts`'s Symbol case still passes.
