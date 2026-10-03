---
title: "Result#column_type is one private instance method, not a host-param module function behind a #private wrapper"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8426 while converging `columnType`'s body onto
`vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb:224-230`:

```ruby
private
  def column_type(name, index, type_overrides)
    type_overrides.fetch(name) do
      column_types.fetch(index) do
        column_types.fetch(name, Type.default_value)
      end
    end
  end
```

Rails defines it as one private instance method of `Result`. trails splits it in two
(`packages/activerecord/src/result.ts`):

- `#columnType(name, index, typeOverrides)`, a JS `#private` method on `Result` whose body is
  only `return columnType(this, name, index, typeOverrides);`, and
- `export function columnType(result, name, index, typeOverrides)`, an exported module function
  that takes the receiver as an explicit host parameter and reads `result.columnTypes`.

`#columnType` is the only caller of the exported function, so the extra function and its
leading `result` parameter have no counterpart in Rails. `castValues` (`result.rb:165-189`) calls
`#columnType` at the two sites Rails calls `column_type`.

## Acceptance criteria

- [ ] `Result` has a single `private columnType(name, index, typeOverrides)` method, marked
      `@internal`, with the body above. `castValues` calls `this.columnType(...)`.
- [ ] The exported module function `columnType` and the `#columnType` wrapper are both deleted.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate`
      stay green, and `result.test.ts` passes.
