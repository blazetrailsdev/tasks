---
title: "connectionSpecificationName carries primary_class? / connection_class? arms Rails' two-arm reader does not have"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8103
claim: "2026-09-25T19:20:45Z"
assignee: "trails-actions-insert-at-marker-instead-of-rails-sentinel"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ConnectionHandling#connection_specification_name`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:316-321`)
has two arms:

```ruby
def connection_specification_name
  if @connection_specification_name.nil?
    return self == Base ? Base.name : superclass.connection_specification_name
  end
  @connection_specification_name
end
```

The trails port, `connectionSpecificationName`
(`packages/activerecord/src/connection-handling.ts:387`), adds two arms Rails
doesn't have, on the path where the class has no own name:

- `if (typeof (this as any).primaryClassQ === "function" && (this as any).primaryClassQ()) return "ActiveRecord::Base";`.
  Rails never asks `primary_class?` here. A primary abstract class gets
  `Base.name` because `connects_to` / `establish_connection` seat
  `@connection_specification_name` (`connection_handling.rb:141-145`,
  `if !connection_class? && !primary_class?` → `self.connection_class = true`),
  not because this reader special-cases it.
- `if ((this as any).isConnectionClass?.()) return this.name;`. Rails never
  asks `connection_class?` here either. A connection class's own
  `@connection_specification_name` is set by `establish_connection`, so it
  already hits the final `@connection_specification_name` arm.

Both arms also use guards Rails doesn't have (`typeof … === "function"`,
`?.()`).

Found while renaming `connectionClassQ` → `isConnectionClass` in trails#7981.
The sibling `remove-connection-reads-inherited-specification-name` (0155, done)
fixed a different caller of the same function.

## Converged shape

```ts
export function connectionSpecificationName(this: typeof Base): string {
  if (this._connectionSpecificationName == null) {
    return this === Base ? Base.name : superclass(this).connectionSpecificationName();
  }
  return this._connectionSpecificationName;
}
```

This should be an own-property read, the way Ruby's `@ivar` is per-class. The
`primary_class?` / `connection_class?` handling moves back into
`connects_to` / `establish_connection`'s seating (`connection_handling.rb:141-145`)
if any caller turns out to rely on these arms.

## Acceptance criteria

- `connectionSpecificationName` has Rails' two arms only. The `primaryClassQ` /
  `isConnectionClass` arms and their `typeof` / `?.()` guards are gone.
- Any test that relied on the invented arms is fixed by seating the name the way
  `connection_handling.rb:141-145` does, not by restoring the arm.
- `pnpm parity:api:calls` / `calls:args` are green without new baseline rows,
  and the connection-handling tests (`connection-handling.test.ts`,
  `connection-handlers-multi-db.test.ts`, `primary-class.test.ts`) pass.
