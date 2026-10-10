---
title: "activerecord: setup_fixture_accessors drops the two is_a?(Symbol) conversion arms"
status: done
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8732
claim: "2026-10-09T22:09:41Z"
assignee: "preserve-original-encrypted-skips-its-column-check-on-a-cold-schema-cache"
blocked-by: null
closed-reason: null
---

## Context

`TestFixtures::ClassMethods#setup_fixture_accessors`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:72-83`) normalizes each
fixture set name through two Symbol arms:

```ruby
key = fs_name.to_s.include?("/") ? -fs_name.to_s.tr("/", "_") : fs_name
key = -key.to_s if key.is_a?(Symbol)
fs_name = -fs_name.to_s if fs_name.is_a?(Symbol)
fixture_sets[key] = fs_name
```

`setupFixtureAccessors` (`packages/activerecord/src/test-fixtures.ts:108-120`) keeps the `/`
ternary and drops both `is_a?(Symbol)` arms, so
`pnpm parity:api:arms:report --package=activerecord --direction=missing` reads `-if -if`. It also
drops the three `String#-@` calls, which now have a ruby-compat spelling (`strUminus`,
`packages/ruby-compat/src/string/support.ts`).

A Ruby Symbol is a JS string (root `CLAUDE.md` § "Ruby idioms that do not translate literally"),
and a fixture set name carries no leading colon, so neither arm has a value to test in trails.
The row is therefore either a comparer fold (a `x = -x.to_s if x.is_a?(Symbol)` modifier whose
whole effect is Symbol-to-String conversion is no arm in a port where both are strings) or two
receipted omissions. No story owns it: `activerecord-test-fixtures-method-missing-accessors` and
`test-fixture-accessors-are-untyped` (RFC 0174) are about `method_missing` and typing.

## Acceptance criteria

- [ ] The two `is_a?(Symbol)` conversion arms are decided: folded by the arms comparer with a
      `scripts/api-compare` test, or ported.
- [ ] `setupFixtureAccessors` calls `strUminus` where Rails calls `-@`, or the omission is
      decided the same way.
- [ ] The missing-direction arms report has no `test-fixtures.ts#setupFixtureAccessors` row.
