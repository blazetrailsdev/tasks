---
title: "Eliminate the pending counter-cache deferral by resolving the belongs_to target lazily"
status: blocked
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-21T11:40:36Z"
assignee: "hash-config-primary-resolves-via-global-configurations"
blocked-by: 'Lazy resolution needs a reverse index the class_attribute cannot carry. `_counter_cache_columns` is unioned onto the TARGET class from the OWNER''s belongs_to (belongs_to.rb:39-40); the only reads are `counter_cache_column?` (counter_cache.rb:182-184) and counter-cache.ts:272, both plain reads of the class_attribute declared at counter_cache.rb:9. Deferring the union to first read therefore requires scanning every entry of `modelRegistry` (associations.ts) for a belongs_to whose `className` names the reader — turning a class_attribute read into a full-registry computation, which is strictly MORE invented machinery than the single documented ESM deferral in counter-cache-state.ts it would replace. Concrete ordering case: CpkBook is declared before CpkOrder in test-helpers/models/cpk.ts, so `safeConstantize("CpkOrder")` returns nothing at builder time and nothing in CpkOrder''s own definition can see the pending column. Rails'' reflection.klass memo (reflection.rb:422-423) does not help: it resolves the OWNER''s view of the target, not the target''s view of its owners.'
closed-reason: null
---

## Context

PR #6800 converged the counter-cache staging layer down to Rails' shape:
`BelongsTo.addCounterCacheCallbacks`
(`packages/activerecord/src/associations/builder/belongs-to.ts:74-88`) now
ports `belongs_to.rb:39-40` literally —

```ruby
klass = reflection.class_name.safe_constantize
klass._counter_cache_columns |= [cache_column] if klass && klass.respond_to?(:_counter_cache_columns)
```

— and the three-way key matching (`_registryKeys`, `"::ClassName"` suffix) plus
`getCounterCacheColumns` are gone.

What remains is one residue with no Rails counterpart:
`packages/activerecord/src/counter-cache-state.ts`, a module-global
`Map<string, Set<() => string>>` staging _thunks_ for the arm where
`safeConstantize` returns nothing, drained by
`flushPendingCounterCacheColumns(modelClass, key)` from `registerModel`
(`associations.ts`). It exists because ESM evaluates imports eagerly and has no
hook that faults a module in when a name is first referenced, so a
`belongs_to ..., counterCache: true` whose target module has not evaluated yet
cannot resolve its target at builder time the way Ruby's autoload does.

Rails needs no deferred half at all: `belongs_to.rb:39-41` records nothing when
the constant does not resolve, because in Ruby it always does.

## Converged shape

Investigate resolving the target lazily instead of staging eagerly. Rails'
`reflection.klass` is itself a memo (`reflection.rb:422-423`,
`@klass ||= compute_class(class_name)`) resolved on first _use_, not at builder
time; the counter column is only ever read through
`_counter_cache_columns` (`counter_cache.rb:182-184`). If the union onto the
target can be deferred to the first read of `_counter_cache_columns` — walking
the owner's `_reflections` for `belongs_to`s that name this class — then the
staging map, the thunks and the `registerModel` flush call all go, and
`belongs_to.rb:39-41` ports with no deferred half.

If that genuinely cannot work, the residue stays as the single documented
ESM deferral it is now, and this story blocks with the specific blocker.

## Acceptance criteria

- `counter-cache-state.ts` is deleted and `flushPendingCounterCacheColumns` /
  its `registerModel` call sites are gone, OR the story is blocked with the
  concrete ESM ordering case that defeats lazy resolution.
- `counter-cache.test.ts`, `counter-cache.trails.test.ts` and
  `associations/belongs-to-associations.test.ts` stay green, including the CPK
  case (`CpkBook` declared before `CpkOrder` in `test-helpers/models/cpk.ts`,
  which is what forced the thunks — an eager derivation there yields
  `cpk_books_count` instead of `books_count`).
- `pnpm parity:api:extra --package activerecord` reports no new novel surface.
