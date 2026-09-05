---
title: "Errors lacks the to_json mixin Ruby gets from Object's core_ext"
status: claimed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Errors#to_json` is not defined on `Errors` — every object gets it from
`ActiveSupport::ToJsonWithActiveSupportEncoder#to_json`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:34-50`),
which routes to `ActiveSupport::JSON.encode(self, options)` and thence to
`as_json`. That is what `test_errors_to_json`
(`vendor/rails/activemodel/test/cases/validations_test.rb:212-221`) exercises:
`assert_equal t.errors.to_json, hash.to_json`.

In trails the mixin is opt-in per class rather than a core_ext on `Object`
(`packages/activesupport/src/core-ext/object/json.ts:47-62`, exported as
`ToJsonWithActiveSupportEncoder`). `Model` includes it
(`packages/activemodel/src/model.ts`), but `Errors`
(`packages/activemodel/src/errors.ts`) does not — it defines `asJson`
(`errors.ts:119`) and nothing else. So `t.errors.toJSON()` does not exist.

PR #7419 converged the assertion by calling the encoder directly on both sides:

```ts
expect(ActiveSupportJSON.encode(t.errors)).toEqual(ActiveSupportJSON.encode(hash));
```

which reproduces the Ruby chain but does not read like the Ruby call site, and
leaves the `to_json` half of `Errors`' public surface unported.

## Converged shape

Include `ToJsonWithActiveSupportEncoder` on `Errors` the way `Model` does, so
`Errors#toJSON` exists and routes through `ActiveSupport::JSON.encode` -> `asJson`,
then rewrite the assertion as `expect(t.errors.toJSON()).toEqual(hash.toJSON?…)` —
whatever spelling the ported `to_json` settles on for the hash side — so the trails
call site mirrors `t.errors.to_json, hash.to_json`.

Check first whether the same gap exists on the other ActiveModel classes Rails
reaches `to_json` on through `Object`; if so, converge them in the same pass or
name them here.

## Acceptance criteria

- `Errors` carries `ToJsonWithActiveSupportEncoder`, so `errors.toJSON()` encodes
  through `ActiveSupport::JSON.encode` and `asJson`.
- `it("errors to json")` in `packages/activemodel/src/validations.test.ts` calls
  `t.errors.toJSON()` rather than the encoder directly.
- `pnpm parity:test:assertions --package activemodel` keeps `validations_test.rb`
  at 0 count / 0 kind / 0 value mismatches.
