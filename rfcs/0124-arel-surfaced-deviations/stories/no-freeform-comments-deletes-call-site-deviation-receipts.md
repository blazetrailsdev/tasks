---
title: "no-freeform-comments deletes the call-site deviation receipts CLAUDE.md requires"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
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

`blazetrails/no-freeform-comments` (RFC 0124) permits only "the repo's JSDoc
flags with their permanence token, and tool directives". CLAUDE.md's fidelity
rules require the opposite in one specific place: **"Every deviation you do ship
is justified AT THE CALL SITE, not in the PR body."** A call-site receipt naming
the Rails reader a deviation answers for is prose, so in an enrolled directory
it is now a lint error.

This already fired once. PR #7135 (RFC 0112,
`burn-down-internal-schema-cache-readers-onto-the-bound-handle`) added six
call-site receipts, each citing the synchronous Rails reader the site answers
for and the async `BoundSchemaReflection` method that cannot serve it. The one
in `packages/activerecord/src/support/schema-cache-dump.ts` had to be **deleted**
on rebase — `packages/activerecord/src/support/**` is enrolled (eslint.config.mjs)
and the post-rebase lint failed on it. The fact it recorded (Rails puts
`marshal_dump` on `SchemaCache` alone, schema_cache.rb:416-418;
`BoundSchemaReflection`, schema_cache.rb:150-200, has no counterpart, so there is
no one-arg form to converge onto in either language) now lives nowhere in-tree.

The other five receipts in that PR — `model-schema.ts` (4) and
`attribute-methods/primary-key.ts` (1) — are legal only because their slices are
not enrolled yet. The enrollment set is only-grow by construction, so they will
become errors when their slice lands, and the reasoning will be deleted the same
way unless this is settled first.

The two escape hatches that ARE tag-shaped (`@noRailsEquivalent
PERMANENT|CONVERGEABLE`, `@missingRailsCall`) do not cover this case: they attach
to a declaration, not to a read inside a body, and in `src/support/**` — outside
both compare populations — a `@noRailsEquivalent` tag is inert and risks tripping
the stale-tag gate.

## Converged shape

Decide which convention wins for an in-body deviation receipt, and make the rule
express it. Options, in rough order of preference:

1. Extend `no-freeform-comments` to keep a comment carrying a recognised
   permanence token (`PERMANENT` / `CONVERGEABLE`) plus a `gem/path.rb:LINE`
   cite — the same shape the JSDoc flags already use, so the keep-rule stays
   mechanical rather than judgemental.
2. Define an in-body tag directive (e.g. `// @railsCite <gem/path.rb:LINE> —
   PERMANENT|CONVERGEABLE <reason>`) and add it to the rule's directive
   allowlist.
3. Rule that in-body receipts move to the enclosing declaration's JSDoc, and
   document that in CLAUDE.md so the fidelity rule and the lint rule agree.

Whichever is chosen, restore the `schema-cache-dump.ts` receipt in the new shape
and re-file the five surviving `model-schema.ts` / `primary-key.ts` receipts
before those slices enroll.

## Acceptance criteria

- [ ] CLAUDE.md and `no-freeform-comments` agree on where an in-body deviation
      receipt lives; neither rule silently deletes the other's output.
- [ ] The `schema-cache-dump.ts` `marshal_dump` receipt is back in-tree in the
      sanctioned shape.
- [ ] Enrolling a new slice does not require deleting an existing Rails-cited
      call-site receipt.
