---
title: "activemodel: Serializers::JSON test models use extends, so the included hook never runs"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7527
claim: "2026-09-05T18:26:52Z"
assignee: "attribute-set-envelope-loses-unregistered-type-keys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7508, which deleted `Serializers::JSON`'s duplicate
`model_name` so the class picks up `Naming`'s through its `[included]` hook —
the port of `json.rb:12-16`:

```ruby
included do
  extend ActiveModel::Naming

  class_attribute :include_root_in_json, instance_writer: false, default: false
end
```

Every model in `packages/activemodel/src/serializers/json.test.ts` (and
`json.trails.test.ts`) is written `class Person extends JSONHost { ... }`. A
native `extends` inherits the statics but never runs `[included]`, so those
classes get neither the `extend ActiveModel::Naming` nor the
`class_attribute :include_root_in_json` that Ruby's `include` performs — the
`includeRootInJson` static is merely inherited and shadowed by assignment.
PR #7508 hand-wired `extend(this, Naming)` into the three classes whose tests read
`modelName` (`json.test.ts:9,38,78`) to keep them working; PR #7508 is where
that symptom appears.

Ruby's counterpart spells the include in the class body
(`vendor/rails/activemodel/test/models/contact.rb:5`,
`vendor/rails/activemodel/test/cases/serializers/json_serialization_test.rb`),
and trails already has the idiom — `serialization.trails.test.ts:26` does
`include(this, SerializersJSON)` inside a `static {}` block, with the
class/interface merge on the type side.

## Converged shape

Each test model in `serializers/json.test.ts` and `json.trails.test.ts` becomes
a standalone class that spells `include(this, JSONHost)` in its `static {}`
block, so the `[included]` hook runs exactly where Ruby's `include` does, and
the three hand-wired `extend(this, Naming)` calls are deleted. Type side uses
the `Included<typeof JSONHost>` interface merge the repo already uses.

Note `json.test.ts` describes itself as "Serializers::JSON host" and has no
Rails counterpart file; see [[test-compare-lint-and-serializers-json-mapping]]
for the mapping half. If it is genuinely trails-only it should be renamed to
`json.trails.test.ts` as part of this — check `parity:test` before and after.

## Acceptance criteria

- No class in `packages/activemodel/src/serializers/*.test.ts` reaches
  `Serializers::JSON`'s members through `extends`; each spells `include()`.
- No test calls `extend(this, Naming)` — the `[included]` hook supplies it.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
