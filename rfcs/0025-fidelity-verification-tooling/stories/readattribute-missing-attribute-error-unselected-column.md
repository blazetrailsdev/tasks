---
title: "readattribute-missing-attribute-error-unselected-column"
status: done
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4857
claim: "2026-07-14T01:02:35Z"
assignee: "readattribute-missing-attribute-error-unselected-column"
blocked-by: null
closed-reason: null
---

## Context

`readAttribute` / `_readAttribute` diverge from Rails for a known-but-unselected
column. Surfaced while converging `packages/activerecord/src/attribute-methods.test.ts`
(story `converge-attribute-methods-test-canonical-schema`).

trails: `packages/activerecord/src/attribute-methods/read.ts:39`

```ts
export function _readAttribute(this: AttributeHolder, name: string): unknown {
  return this._attributes.fetchValue(name) ?? null;
}
```

The `?? null` swallows the missing-attribute case, so `record.readAttribute("developer")`
on a `select(:id, ...)` record returns `null` instead of raising.

Rails: `vendor/rails/activerecord/lib/active_record/attribute_methods/read.rb:29`
`read_attribute` → `@attributes.fetch_value(name)`; for a known column that
wasn't loaded the LazyAttributeSet default raises `ActiveModel::MissingAttributeError`
(`/attribute 'developer' for Computer/`), while an unknown name (`no_column_exists`)
returns nil. The generated per-attribute getter in trails DOES raise
(`attribute-methods.ts:255`/`:354`), so trails is internally inconsistent:
getter raises, `readAttribute`/`[]` does not.

Rails test that exercises this (`attribute_methods_test.rb:437`):

```ruby
test "read_attribute raises ActiveModel::MissingAttributeError when the attribute isn't selected" do
  computer = Computer.select(:id, :extendedWarranty).first
  assert_raises(ActiveModel::MissingAttributeError, match: /attribute 'developer' for Computer/) do
    computer[:developer]
  end
  assert_nothing_raised { computer[:extendedWarranty] }
  assert_nothing_raised { computer[:no_column_exists] }
end
```

The trails port currently asserts via the generated getter to get the raise;
once `readAttribute` converges it should read `record.readAttribute("legacy_comments_count")`
to mirror Rails `computer[:developer]` (bracket = read_attribute) exactly.

## Acceptance criteria

- [ ] `readAttribute`/`_readAttribute` raises `MissingAttributeError` for a known
      column that wasn't selected, matching Rails `fetch_value`; unknown names
      still return nil (`no_column_exists`).
- [ ] Update `attribute-methods.test.ts` "read_attribute raises
      ActiveModel::MissingAttributeError when the attribute isn't selected" to read
      via `readAttribute(...)` (mirroring Rails `[]`) instead of the generated getter.
- [ ] No regression in api:compare / test:compare.
