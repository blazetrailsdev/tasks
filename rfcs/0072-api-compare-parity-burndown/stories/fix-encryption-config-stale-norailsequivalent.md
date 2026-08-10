---
title: "parity:api:extra red on main: stale @noRailsEquivalent on encryption/config.ts getSharedConfig"
status: closed
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone on origin/main (311bff350): getSharedConfig no longer exists anywhere in packages/activerecord/src, so neither parity:api:extra row (STALE tag, missing permanence claim) can fire. The only @noRailsEquivalent left in packages/activerecord/src/encryption/config.ts is on the compressor duck-type at :19 and already opens with PERMANENT. The gate red this story was filed against is resolved."
---

## Context

`pnpm parity:api:extra --package activerecord` fails on `main` (observed at 07bf64a,
unrelated to the PR that observed it) with two rows against the same member:

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) ...
  - activerecord  encryption/config.ts  getSharedConfig

extra-surface: 1 @noRailsEquivalent tag(s) state no permanence claim ...
  - activerecord  encryption/config.ts  getSharedConfig
```

STALE means the tag sits on a member that no longer flags as extra surface —
per the gate's own message: Rails gained the method, the file mapping changed,
the declaration went internal or `_`-prefixed, a bare `@tag` word in the reason
prose truncated it, or the tag covers a moved port belonging in its
Rails-layout file. The second row says the reason does not open with PERMANENT
or CONVERGEABLE.

Because it is a **hard gate failure on main**, every PR touching activerecord
sees a red `parity:api:extra` it did not cause, which trains people to ignore the gate.

## Converged shape

Read `packages/activerecord/src/encryption/config.ts` and establish which of
the STALE causes applies. Almost certainly the tag is simply obsolete and the
fix is to delete it next to the code (the gate says exactly that: "Delete the
tag next to the code"). If the member _is_ still extra surface, the fix is
instead to remove the surface — fold it into the ported method or delete it —
not to reword the tag.

Rails counterpart to check first:
`vendor/rails/activerecord/lib/active_record/encryption/config.rb`.

## Acceptance criteria

- `pnpm parity:api:extra --package activerecord` exits 0.
- If the tag was deleted, no `@noRailsEquivalent` remains on `getSharedConfig`.
- If the surface was genuinely extra and is kept, its reason opens with
  PERMANENT (a language/runtime fact) or CONVERGEABLE (naming the story) —
  but prefer deleting the surface over writing a better justification.
