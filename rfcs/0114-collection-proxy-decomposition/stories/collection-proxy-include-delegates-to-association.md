---
title: "include? is !!@association.include?(record), not 46 lines of re-derived guard + scan"
status: done
updated: 2026-08-19
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6743
claim: "2026-08-19T14:30:05Z"
assignee: "collection-proxy-clear-delegates-to-delete-or-nullify-all-records"
blocked-by: null
closed-reason: null
---

## Context

Rails' proxy body is one line:

```ruby
def include?(record)      # collection_proxy.rb:927-929
  !!@association.include?(record)
end
```

and `CollectionAssociation#include?`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:258-270`)
owns the whole decision: the `record.is_a?(reflection.klass)` guard, the
`loaded?`/`@target` scan via `include_in_memory?` (`:507-519`), and the
`scope.exists?(record.id)` fallback.

`packages/activerecord/src/associations/collection-proxy.ts:1711-1774` is
**46 code lines** re-deriving that: it rebuilds the class name from
`this._assocDef.options.className ?? camelize(singularize(this._assocName))`
rather than reading the reflection's klass, then does its own in-memory scan and
`exists` fallback. `_includeInMemoryThrough` (`:1452`, 23 lines) is the through
arm of the same thing — Rails' `include_in_memory?` handles through inline at
`collection_association.rb:507-519`.

trails already has the destination: `CollectionAssociation#isInclude` at
`packages/activerecord/src/associations/collection-association.ts:811`.

## Converged shape

`isInclude(record)` becomes `!!(await this._collectionAssociation().isInclude(record))`
— matching the shape `delete()` (`:1522`) and `size()` (`:1190`) already use.
Anything the proxy body does that `CollectionAssociation#isInclude` does not
(the through in-memory arm, if it is genuinely missing) moves into
`collection-association.ts` at Rails' `include_in_memory?` name, or into
`has-many-through-association.ts` where the through arm belongs.

The class-name reconstruction is deleted: the reflection's klass is what Rails
compares against, and `reflection` is already a getter on the proxy (`:314`).

## Acceptance criteria

- `isInclude` in `collection-proxy.ts` is a one-line delegation.
- `_includeInMemoryThrough` no longer exists in `collection-proxy.ts`; any
  behaviour it carried lives at a Rails name in `collection-association.ts` or
  `has-many-through-association.ts`.
- No `camelize(singularize(...))` class-name reconstruction remains in
  `collection-proxy.ts` for this path.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- Existing suites pass unchanged (`has-many-associations.test.ts`,
  `has-many-through-associations.test.ts`, `collection-proxy.test.ts`). No test
  renamed.
