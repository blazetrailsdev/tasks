---
title: "globalid: BaseLocator#findRecords applies :includes and drops invented guards"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9145
claim: "2026-10-20T18:21:16Z"
assignee: "conventions-ruby-reserved-word-identifiers"
blocked-by: null
closed-reason: null
---

## Context

`BaseLocator#findRecords` (`packages/globalid/src/locator.ts`) still deviates from Rails' `find_records` (`vendor/globalid/v1.3.0/lib/global_id/locator.rb:176-184`):

```ruby
def find_records(model_class, ids, options)
  model_class = model_class.includes(options[:includes]) if options[:includes]
  if options[:ignore_missing]
    model_class.where(primary_key(model_class) => ids)
  else
    model_class.find(ids)
  end
end
```

The TS version:

- does not apply `options.includes`. `BaseLocator#locate` was converged in trails#9132.
- adds `modelClass.where && !Array.isArray(pk)` guards that Rails does not have.
- throws an invented `Error` when the relation lacks `toArray`, and normalizes `find`'s result with `Array.isArray(result) ? result : [result]`.

`locateMany` (`locator.rb:133-151`) also reads records with `index_by` on `record.id`, while the TS version reads them through `recordIdProp(pk)`.

## Acceptance criteria

- [ ] `findRecords` applies `includes`, then `where({[primaryKey]: ids})` or `find(ids)`, with the same branch order as Rails. The invented guards and the throw are removed.
- [ ] The TS-only test "locateMany with ignoreMissing throws if where() lacks toArray" (global-locator.trails.test.ts) is removed or converged.
