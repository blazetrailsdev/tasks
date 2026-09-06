---
title: 'RecordNotFound renders a composite key as shop_id,id where Ruby renders ["shop_id", "id"]'
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`raise_record_not_found_exception!` interpolates the primary key straight into
the message (`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:427,430`):

```ruby
error = "Couldn't find #{name} with '#{key}'=#{ids}#{conditions}"
error = +"Couldn't find all #{name.pluralize} with '#{key}': "
```

For a composite primary key `key` is an Array, and Ruby's string interpolation
calls `to_s`, so Rails renders `'["shop_id", "id"]'`.

The port defaults `key` with `String(this.model.primaryKey)`
(`packages/activerecord/src/relation/finder-methods.ts:456`), and JS
`String(["shop_id","id"])` is `"shop_id,id"` — no brackets, no quotes, no space.
Verified against MRI: `ruby -e 'p "#{["shop_id","id"]}"'` => `"[\"shop_id\", \"id\"]"`.

Surfaced by PR #7531 while converging the sibling divergence in the same method
(the composite `ids` list, which Ruby's `Array#join` flattens). That fix landed;
this one is the `key` half and was left out of scope. The trails test added there
(`finder-methods.trails.test.ts`, "renders composite ids the way Ruby's Array#join
does") currently pins `'shop_id,id'`, so it is the assertion to update.

Adjacent, same body: `formatNotFoundAllMessage`
(`finder-methods.ts:90-107`) is a module-private helper Rails does not have —
`finder_methods.rb:429-433` builds the string inline. It is unexported so it does
not score as extra surface, but it is still a decomposition Rails lacks and the
natural thing to inline while fixing the rendering.

## Converged shape

Render an Array `key` the way Ruby's `Array#to_s` (i.e. `inspect`) does —
`["shop_id", "id"]` — rather than through `String()`. `rubyInspect`
(`packages/activerecord/src/relation/ruby-inspect.ts:4`) already exists and is
used elsewhere for exactly this. Inline `formatNotFoundAllMessage` back into
`raiseRecordNotFoundExceptionBang` while there.

## Acceptance criteria

- [ ] A composite-key `RecordNotFound` message renders its key as
      `["shop_id", "id"]`, verified against MRI rather than against the current
      TS string.
- [ ] The single-id arm (`:427`) renders the same way.
- [ ] `formatNotFoundAllMessage` is inlined; `finder-methods.trails.test.ts`'s
      assertion is updated to the Rails rendering.
- [ ] Composite-primary-key finder suites stay green on all three adapters.
