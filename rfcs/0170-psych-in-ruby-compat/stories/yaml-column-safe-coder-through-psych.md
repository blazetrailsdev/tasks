---
title: "Converge YAMLColumn::SafeCoder onto YAML.dump / safe_dump / unsafe_load / safe_load"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps:
  [
    "psych-load-and-safe-load",
    "psych-safe-dump-and-restricted-yaml-tree",
    "psych-libyaml-seam-without-top-level-await",
  ]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb:8-57`: `dump` is
`::YAML.dump` when unsafe, else `::YAML.safe_dump(object, permitted_classes:
@permitted_classes + ActiveRecord.yaml_column_permitted_classes, aliases:
true)`. `load` is `YAML.unsafe_load` when unsafe, else `YAML.safe_load(payload,
permitted_classes: …, aliases: true)`. trails
(`packages/activerecord/src/coders/yaml-column.ts`) dumps through the npm
`stringify` behind a hand-rolled `assertDumpable`, and loads through npm
`parse` with **no** permitted-class check on load.

Fidelity traps (predicted):

- [ ] `@unsafe_load.nil? ? ActiveRecord.use_yaml_unsafe_load : @unsafe_load`
      is a nil check. `false` must not fall through to the global.
- [ ] `yaml_column_permitted_classes` defaults to `[Symbol]`
      (`active_record.rb:453-454`). trails seeds it with the JS `Symbol`
      (`active-record.ts:54`), but a Ruby Symbol is a `":name"` string. Check
      that `ClassLoader::Restricted` sees what Rails permits.
- [ ] Take the `Psych::VERSION >= 5.1` and `respond_to?(:unsafe_load)` arms
      (`:14,32`) unconditionally. Vendored Psych is 5.1.2 (`versions.rb`), so
      no `Psych.VERSION` export is needed (RFC §4).

## Acceptance criteria

- [ ] `SafeCoder#dump` / `#load` call `YAML.dump` / `YAML.safeDump` /
      `YAML.unsafeLoad` / `YAML.safeLoad` with Rails' arguments, and
      `assertDumpable` is deleted.
- [ ] Loading a payload that names an unpermitted class raises
      `Psych.DisallowedClass` "Tried to load unspecified class: …". This is a
      new behaviour, so add a test mirroring
      `vendor/rails/v8.0.2/activerecord/test/cases/coders/yaml_column_test.rb`.
- [ ] `serialized_attribute_test.rb`, `store_test.rb` and
      `yaml_column_test.rb` ports stay green.
- [ ] `pnpm parity:api:calls` shows fewer rows for `yaml-column.ts` (delete
      stale rows by hand).

## Verification

`pnpm vitest run packages/activerecord/src/coders/yaml-column.test.ts packages/activerecord/src/serialized-attribute.test.ts packages/activerecord/src/store.test.ts && pnpm parity:api:calls`.
