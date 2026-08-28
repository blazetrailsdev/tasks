---
title: "no-freeform-comments deletes the call-site deviation receipts CLAUDE.md requires"
status: ready
updated: 2026-08-28
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

`no-freeform-comments`' autofix strips the **reason text off the repo's own
deviation tags**, leaving a bare permanence token. PR #7132 (`9415a63a9`) did
this to **244 tags across 757 files**:

```
- * @noRailsEquivalent CONVERGEABLE the adapter-name normalization Ruby does inline in ConnectionAdapters.resolve (connection_adapters.rb:34-39).
+ * @noRailsEquivalent CONVERGEABLE
-   * @missingRailsCall build_statement_pool — CONVERGEABLE (story abstract-adapter-constructor-drops-rails-config-arg): RFC 0106: the base ctor takes no
+   * @missingRailsCall build_statement_pool — CONVERGEABLE
```

The maintainer decision recorded in `close-jsdoc-bypass-in-no-freeform-comments`
("the tag survives and the paragraph around it does not") is what the rule
implements, and for descriptive API prose it is right. But a tag's reason is not
prose around a tag — it is the reviewed artifact several gates are specified in
terms of, and CLAUDE.md states the requirement four times:

- `@noRailsEquivalent <reason>` — "that tag is the only sanctioned exception and
  **the reason is reviewed**".
- Baselining "costs a **reviewed one-line `reason`** for the row you add — never
  leave the seeded placeholder there."
- `unbacked-internal-needs-receipt` (RFC 0121) requires a public `@internal`
  declaration to "ALSO carry a `@noRailsEquivalent PERMANENT|CONVERGEABLE`
  **reason**".
- The call-argument gate: "Its **reason** must open with `PERMANENT` or
  `CONVERGEABLE` … a reason claiming neither is an error, not an assumed
  PERMANENT."

After the strip, every one of those reads as satisfied by a bare token, so the
"reviewed reason" requirement is now vacuous — a receipt can no longer be judged,
only counted. The strip also deleted the `(story <id>)` back-references that link
a deviation to the story that will converge it, which is the burndown's own
index.

Two consequences already observed in PR #7135 (RFC 0112):

1. Its six Rails-cited call-site receipts had to be justified as bare prose, and
   the one in `packages/activerecord/src/support/schema-cache-dump.ts` — an
   enrolled directory — was **deleted** on rebase. The fact it held (Rails puts
   `marshal_dump` on `SchemaCache` alone, schema_cache.rb:416-418;
   `BoundSchemaReflection`, schema_cache.rb:150-200, has no counterpart, so there
   is no one-arg form to converge onto in either language) now lives nowhere
   in-tree.
2. Five surviving receipts in `model-schema.ts` and
   `attribute-methods/primary-key.ts` are legal only because their slices are not
   enrolled. Enrollment is only-grow, so they are queued for the same deletion.

## Converged shape

Keep a tag's reason; delete only the prose around it. Concretely:

1. Teach the rule that everything on a tag's own line (and its hanging
   continuation lines) is **part of the tag**, not narrative — so
   `@noRailsEquivalent CONVERGEABLE <reason>` and
   `@missingRailsCall <call> — <PERMANENT|CONVERGEABLE> <reason>` survive intact,
   while a free paragraph beside them still goes.
2. Give an in-body deviation receipt a tag-shaped form the rule keeps (e.g.
   `// @railsCite <gem/path.rb:LINE> — PERMANENT|CONVERGEABLE <reason>`), so
   CLAUDE.md's "every deviation is justified AT THE CALL SITE" can be satisfied
   inside an enrolled directory at all. Today it cannot.
3. Restore the 244 stripped reasons from `9415a63a9`'s parent, and the
   `schema-cache-dump.ts` receipt, in the kept shape.

Note the tension is only with the REASON, not with the decision: no step here
re-admits descriptive API prose, which stays deleted.

## Acceptance criteria

- [ ] `no-freeform-comments` preserves the reason text and `(story <id>)`
      back-reference on `@noRailsEquivalent` / `@missingRailsCall`, with a test
      pinning both the keep and the surrounding-prose delete.
- [ ] An in-body call-site deviation receipt has a sanctioned shape that survives
      the rule, and CLAUDE.md names it.
- [ ] The 244 reasons stripped by `9415a63a9` are restored.
- [ ] Enrolling a new slice never requires deleting a Rails-cited receipt.
