---
title: "hash_filter iterates the filter instead of slice(*filter.keys), inlines permit_value, and invents an empty-filter arm"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while converging `has_key?` in PR #7321 (RFC 0129). The `has_key?` call is
now faithful (`this.hasKey(k)`); the loop it sits in is not.

Rails
(`activerecord/../actionpack/lib/action_controller/metal/strong_parameters.rb:1349-1359`):

```ruby
def hash_filter(params, filter, on_unpermitted: ..., explicit_arrays: false)
  filter = filter.with_indifferent_access

  # Slicing filters out non-declared keys.
  slice(*filter.keys).each do |key, value|
    next unless value
    next unless has_key? key
    result = permit_value(value, filter[key], on_unpermitted:, explicit_arrays:)
    params[key] = result unless result.nil?
  end
end
```

It iterates a **slice of the receiver** — `slice(*filter.keys)` — so `key`/`value`
are the receiver's own pairs and `filter[key]` is the looked-up declaration.
There is no `with_indifferent_access` step in trails and no `permit_value`
helper; `next unless value` (the RECEIVER's value being falsy) has no counterpart
either.

trails
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:687-...`)
iterates `Object.entries(filter)` instead, inlines what `permit_value` decides
into a chain of `instanceof Parameters` / `Array.isArray` branches, and opens
with an empty-filter special case (`Object.keys(filter).length === 0` permits
every key on the receiver) that Rails does not have — an empty `filter` slices
to nothing in Ruby and permits nothing.

## Converged shape

- Iterate `slice(...Object.keys(filter))` over the receiver, not the filter.
- Keep Rails' two `next unless` guards in order: the receiver's value, then
  `has_key?`.
- Extract `permit_value` as its own private method with the Rails name and
  signature (`strong_parameters.rb:1361`), and call it — Rails extracts it, so
  trails extracts it.
- Delete the empty-filter arm, or show the Rails line that produces it.

## Acceptance criteria

- `_hashFilter` mirrors `hash_filter` branch for branch, with `permitValue`
  extracted at the Rails name.
- The empty-filter special case is gone or cited.
- The strong-parameters suites stay green; any behaviour change from dropping the
  empty-filter arm is called out in the PR body.
- `pnpm parity:api:calls` and `parity:api:calls:args` show no new rows;
  `parity:api:extra` does not grow (`permitValue` has a Ruby counterpart).
