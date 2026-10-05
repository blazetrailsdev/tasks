---
title: "activerecord: TableRow#resolve_enums reads an Integer row value as a String enum label"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TableRow#resolve_enums` (`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/table_row.rb:124-130`) is

```ruby
reflection_class.defined_enums.each do |name, values|
  if @row.include?(name)
    @row[name] = values.fetch(@row[name], @row[name])
  end
end
```

`values` is a `HashWithIndifferentAccess` of label to value, so `fetch(5, 5)` for an Integer row value finds no key and
answers `5`. The port (`packages/activerecord/src/fixture-set/table-row.ts`, `resolveEnums`) reads `defined_enums` off the
private `_enums` Map and calls ruby-compat's `fetch` on a plain object with `this._row[name] as string`. A JS object has
one key type, so a numeric row value `5` is looked up as `"5"` and resolves to the enum value of a label spelled `"5"`,
where Rails leaves it alone. trails PR 8542 removed the `typeof value === "string"` probe that hid this.

## Acceptance criteria

- [ ] `resolveEnums` reads `reflectionClass.definedEnums` (not `_enums`) and its `fetch` distinguishes a String key from an Integer one, as `HashWithIndifferentAccess#fetch` does, with no `typeof` arm added to the body.
- [ ] A fixture row whose enum column holds the Integer `5`, on an enum with a label `"5"`, keeps `5`. Covered by a trails test.
