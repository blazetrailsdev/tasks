---
title: "parity: an extra branch or call inside a ported body has no receipt form (define_call's reader arm)"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8465
claim: "2026-10-03T23:19:02Z"
assignee: "extra-branch-in-a-ported-body-has-no-receipt-form"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8451. `defineCall` (`packages/activemodel/src/attribute-methods.ts`) carries a `reader` arm that Rails' `define_call` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:410-428`) does not have: an alias of a generated reader is emitted as a get/set property, per CLAUDE.md § "Generated attribute readers are properties".

The arm is an extra branch and an extra call (`rbObjRespondTo(this, "defineMethodAttribute", true)`) inside a ported body, and no register sees it:

- `blazetrails/no-freeform-comments` strips a prose citation.
- `@noRailsEquivalent` is for an extra member; `defineCall` is Rails' method.
- `@missingRailsCall` / `@missingRailsArgs` suppress a gate row, and the call gates flag only calls Rails makes that the body omits, so an extra call or branch raises none.

So a deviation of the "extra branch in a ported body" class ships with its justification in the PR body only, which CLAUDE.md § "Fidelity is the job" forbids. The reviewer on 8451 accepted it as carried-over for lack of a receipt form.

## Acceptance criteria

- [ ] Decide the register for an extra branch / extra call in a ported body: either the arms report gates it (an added arm with no Rails arm is a row), or a receipt tag exists for it with the `PERMANENT|CONVERGEABLE <story-id>` discipline.
- [ ] `defineCall`'s `reader` arm carries that receipt against CLAUDE.md § "Generated attribute readers are properties", or is converged away.
- [ ] A scripts test covers the new row or tag.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run scripts/api-compare
```
