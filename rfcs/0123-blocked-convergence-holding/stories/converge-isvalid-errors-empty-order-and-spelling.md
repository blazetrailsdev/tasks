---
title: "Converge Validations#isValid onto Rails' errors.empty? && output order and spelling"
status: draft
updated: 2026-09-18
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `receiver-typing-for-positional-array-idioms` (trails#7865): the
call-mismatches gate flags `activerecord/validations.ts#isValid` for a missing
`errors.empty?` call, baselined with reason "pre-existing divergence... Pending
per-body convergence review" and no owning story.

Rails' `ActiveRecord::Validations#valid?`
(`vendor/rails/activerecord/lib/active_record/validations.rb:69-73`):

```ruby
def valid?(context = nil)
  context ||= default_validation_context
  output = super(context)
  errors.empty? && output
end
```

trails' `isValid` (`packages/activerecord/src/validations.ts:80-97`):

```ts
export async function isValid(...): Promise<boolean> {
  ...
  const result = await _superIsValid.call(this, effectiveContext);
  return result && !this.errors.any;
}
```

Two divergences from the Rails body, both fixable in the same edit:

1. **Order.** Ruby checks `errors.empty?` FIRST, then `&&`s the super result.
   TS checks `result` first. No observable behavior difference today (both
   sides are plain booleans with no side effects), but it is not a faithful
   line-for-line port, and `&&`'s left-to-right evaluation order is exactly
   the kind of thing a later refactor (e.g. adding a side-effecting getter)
   could silently start depending on the wrong way.
2. **Spelling.** Ruby calls `errors.empty?`, the direct analogue of trails'
   OWN `get empty(): boolean` on `Errors`
   (`packages/activemodel/src/errors.ts:31`). TS instead negates the `any`
   getter (`errors.ts:271`) — `!this.errors.any` — which is why the call gate
   flags a missing `empty?` rather than crediting an existing equivalent: the
   port never calls the method the comparator's alias tables would recognize.

## Converged shape

```ts
const result = await _superIsValid.call(this, effectiveContext);
return this.errors.empty && result;
```

Matches Rails' order and calls the `empty` getter that already exists for
exactly this purpose.

## Acceptance criteria

- `isValid` (`packages/activerecord/src/validations.ts`) reordered to
  `this.errors.empty && result`, matching `validations.rb:69-73` line for
  line.
- The `activerecord/validations.json` baseline row for `valid? / empty?` is
  removed (hand-edit via `serializeBaseline`, not a reseed).
- `pnpm parity:api:calls` green with a strictly smaller row count.
- Existing `valid?`/`isValid` tests
  (`packages/activerecord/src/validations.test.ts` or wherever they live)
  stay green — this is a fidelity-only change, not a behavior change.
