---
title: "ActiveModel spells Ruby to_json as toJson, beside the correctly-named toJSON mixin"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6212
claim: "2026-08-08T00:30:11Z"
assignee: "schema-conn-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

`to_json` translates to `toJSON` by the conventions table
(`scripts/api-compare/conventions.ts:894`, `docs/ruby-ts-conventions.md:28`),
but two ActiveModel members that port a Ruby `to_json` are spelled `toJson`:

- `ActiveModel::Model#to_json` — `packages/activemodel/src/model.ts:2268`
- `ActiveModel::Serializers::JSON#to_json` —
  `packages/activemodel/src/serializers/json.ts:204`, against
  `vendor/rails/activemodel/lib/active_model/serializers/json.rb`

Rails itself gets `to_json` on these classes from
`ActiveSupport::ToJsonWithActiveSupportEncoder`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:35-43`,
included at `json.rb:47-49`) — which PR #6208 ported and `include()`d into
`Model`, so `Model` now carries **both** a correctly-named `toJSON` from the
mixin and the invented-spelling `toJson` beside it. `parity:api:extra` scores `toJson`
as novel surface in both files.

The serializers arm also takes a `root` option Rails threads through
`serializable_hash`/`as_json` rather than through `to_json`, so the two are not
a pure rename of each other — read `serializers/json.rb` before collapsing.

## Converged shape

Retire `toJson` in favour of the ported `toJSON`, folding any behavior it has
beyond `ActiveSupport::JSON.encode(self, options)` back into the `as_json` arm
Rails puts it in. Expect a wide call-site sweep: ~20 test files call
`p.toJson()` (activemodel `serializers/json*.test.ts`, `dirty.test.ts`,
`serialization.test.ts`, activerecord `json-serialization.test.ts`), and test
names stay verbatim.

## Acceptance criteria

- [ ] No `toJson` spelling remains in `packages/activemodel`; `to_json` is
      served by `toJSON` at the Rails name.
- [ ] `pnpm parity:api:extra --package activemodel` loses both novel `toJson` rows.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative; no test
      renamed.
