---
title: "No receipt shape exists for an extra call or guard a TS body adds"
status: draft
updated: 2026-08-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md requires that "every deviation you do ship is justified **at the call
site**, not in the PR body". The sanctioned receipts are `@noRailsEquivalent`,
`@missingRailsCall`, `@missingRailsArgs` and `@internal`, and every one of them
describes something trails is **missing or adding as surface**:

- `@noRailsEquivalent` — a public TS name with no Ruby counterpart.
- `@missingRailsCall` — a call Rails makes that the TS body omits.
- `@missingRailsArgs` — a call made with a different argument shape.

None describes an **extra call or an extra guard clause** — a TS body that does
something Rails' body does not. `blazetrails/no-freeform-comments` then strips
any prose written to explain one, including JSDoc prose on an exported
function, so such a deviation has literally nowhere to carry its receipt.

Hit concretely in PR #7233: `defineAttributeMethods` and
`undefineAttributeMethods` (`packages/activerecord/src/attribute-methods.ts`)
each gained an OR clause reading `_attributeMethodsGeneratedByLoad` that
`activerecord/lib/active_record/attribute_methods.rb:104` and `:141-147` do not
have. A JSDoc block explaining it, citing the Rails lines, was autofixed away
by `no-freeform-comments`. The explanation had to be parked in a neighbouring
file's JSDoc (`defineAttributeMethodsAfterLoad` in `model-schema.ts`, which
survives only because it carries `@noRailsEquivalent`), leaving the two call
sites themselves unreceipted.

That is exactly the failure mode the call-site rule exists to prevent: a
reviewer reading `attribute-methods.ts` alone sees an unexplained divergence
from the Ruby.

## Converged shape

A receipt tag for an extra call or guard — the mirror of `@missingRailsCall` —
carrying the same two permanence shapes the other receipt gates enforce:
`PERMANENT`, or `CONVERGEABLE <story-id>`. `no-freeform-comments` recognises it
so the prose beside it survives, and the extra-surface/receipt gates count it
the way they count the existing tags, so it is measured debt rather than a
comment.

Whether it also becomes a **measured** dimension (an "extra calls" ratchet, the
inverse of `parity:api:calls`) is a larger question and can be split out; the
minimum this story owes is a place to write the receipt at the call site.

## Acceptance criteria

- [ ] A sanctioned tag exists for an extra call/guard, with `PERMANENT` /
      `CONVERGEABLE <story-id>` enforced the way `@missingRailsArgs` enforces
      them (a tag claiming neither is an error, a bare `CONVERGEABLE` with no
      story id is half a receipt).
- [ ] `blazetrails/no-freeform-comments` does not strip prose accompanying it.
- [ ] The two OR clauses in `packages/activerecord/src/attribute-methods.ts`
      carry it, pointing at
      `retire-the-define-attribute-methods-after-load-hook`.
- [ ] `docs/ruby-ts-conventions.md` / CLAUDE.md's receipt list names it.
