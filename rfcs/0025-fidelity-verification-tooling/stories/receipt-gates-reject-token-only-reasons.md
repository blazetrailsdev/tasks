---
title: "receipt-gates-reject-token-only-reasons"
status: closed
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by receipt-gates-require-permanent-bare-or-convergeable-story: the wanted shape is bare PERMANENT / CONVERGEABLE <story-id>, not citations or word counts"
---

## Context

`classifyReason` (`scripts/api-compare/missing-rails-call-tags.ts:304-308`)
reads only the leading `PERMANENT` / `CONVERGEABLE` token of a receipt's
reason; everything after it is unexamined. `extra-surface.ts:2284-2295` hard-fails
a tag with neither token ("0 unclassified"), but a tag that is _only_ the token
passes every gate.

PR #7132 (`9415a63a9`) proved the gap: `no-freeform-comments`' autofix stripped
the reason text off 244 tags repo-wide — in arel, all 12 `PERMANENT` receipts
(`packages/arel/src/attributes/attribute.ts:49`, `nodes/sql-literal.ts:22,28,41`,
`table.ts:20`, `temporal-tag.ts:1`, `visitors/connection.ts:1`,
`visitors/ruby-class.ts:1`, `math.ts:17`, `predications.ts:119`, and the
`@missingRailsCall uniq — PERMANENT` at `nodes/bound-sql-literal.ts:14`). Before:

```
 * @noRailsEquivalent PERMANENT: `SqlLiteral < String` (sql_literal.rb:5), so
```

After:

```
/** @noRailsEquivalent PERMANENT */
```

`parity:api:extra`, `parity:api:extra:gate`, `parity:api:calls` and
`parity:api:calls:args` all stayed green through that commit. CLAUDE.md says
the reason "is reviewed" in four places; today nothing can tell a reviewed
reason from an empty one. The sibling story
`no-freeform-comments-deletes-call-site-deviation-receipts` (RFC 0124) fixes
the rule and restores the text; this story makes the loss impossible to
re-land.

## Acceptance criteria

- `classifyReason` (or a companion `reasonIsSubstantive`) returns a third
  bucket, `token-only`, for a reason that is the permanence token followed by
  nothing but punctuation/whitespace. Substantive means at least one of: a
  `.rb:LINE` (or `.rb`) citation, a `(story <id>)` / `story-` back-reference,
  or a minimum word count (pick one number, document it in the tag section of
  `extra-surface.ts`'s help text).
- `extra-surface.ts` fails the run on any `token-only` tag, the way it fails
  on `unclassified` — hard 0, no ratchet, no reseed — and the failure names
  file:line.
- `missing-rails-call-tags.ts` / `missing-rails-args-tags.ts` apply the same
  check to `@missingRailsCall` / `@missingRailsArgs`.
- Unit tests pin: token only → fails; token + citation → passes; token +
  prose without citation → whichever rule was chosen, pinned.
- On landing, the run is red at exactly the 244 sites #7132 stripped (or
  fewer, if the 0124 restoration landed first); this story does not restore
  them, it only refuses them.
