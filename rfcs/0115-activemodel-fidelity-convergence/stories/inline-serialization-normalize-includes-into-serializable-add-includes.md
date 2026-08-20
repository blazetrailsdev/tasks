---
title: "Inline normalizeIncludes into serializable_add_includes"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-08-20T12:52:31Z"
assignee: "converge-accepts-multiparameter-time-cast-from-multiparameter"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/serialization.rb:184-196`:

```ruby
def serializable_add_includes(options = {}) # :nodoc:
  return unless includes = options[:include]

  unless includes.is_a?(Hash)
    includes = Hash[Array(includes).flat_map { |n| n.is_a?(Hash) ? n.to_a : [[n, {}]] }]
  end

  includes.each do |association, opts|
    if records = send(association)
      yield association, records, opts
    end
  end
end
```

The `unless includes.is_a?(Hash)` normalisation is **three lines, inline**.

`packages/activemodel/src/serialization.ts` extracts it into
`normalizeIncludes` (`:732`, 28 code lines) plus the `hasIncludes` predicate
(`:375`) and `storeHasKey` (`:366`). CLAUDE.md, "Decomposition": _"If Rails
inlines something, inline it."_

`serializableAddIncludes` itself exists twice in `serialization.ts` (`:96`,
31 lines; `:333`, 11 lines) — check whether both are Rails arms or whether one
is a second spelling, and converge if so.

## Acceptance criteria

- `normalizeIncludes`, `hasIncludes` and `storeHasKey` are gone; the
  normalisation is inline in `serializableAddIncludes`, matching
  `serialization.rb:187-189` line for line.
- If the two `serializableAddIncludes` bodies are the same Rails method, one
  survives.
- `pnpm parity:api:extra --package activemodel` `serialization.ts` novel count
  drops.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/serialization.test.ts
```
