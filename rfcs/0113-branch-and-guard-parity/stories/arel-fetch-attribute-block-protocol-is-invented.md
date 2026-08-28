---
title: "Type Arel fetchAttribute's block protocol explicitly (the protocol itself is Rails')"
status: done
updated: 2026-08-28
rfc: "0113-branch-and-guard-parity"
cluster: missing-arm
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7153
claim: "2026-08-28T11:42:16Z"
assignee: "adapter-name-getter-conflates-rails-adapter-name-with-type-registry-key"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Arel.fetch_attribute` in PR #5965.

Ruby's `fetch_attribute(&block)` implementations yield to a block whose
control flow is Ruby's own — `break` aborts the enclosing `each`, and a
`return` in the caller's block (e.g. `where_clause.rb:136-143`
`extract_attribute`) returns from the calling method outright. See
`vendor/rails/activerecord/lib/arel/nodes/nary.rb:21`,
`binary.rb:33`, `grouping.rb:6`, `homogeneous_in.rb:54`, `sql_literal.rb:22`,
`node.rb:155`.

trails' ports instead invent a **boolean-returning callback protocol**: the
block returns `true` to keep traversing and `false` to stop
(`packages/arel/src/nodes/binary.ts:101` `fetchAttributeFromBinary`,
`nodes/nary.ts`, `nodes/grouping.ts`, `nodes/homogeneous-in.ts`). Every caller
must know and honour that convention —
`packages/activerecord/src/relation/where-clause.ts:324` `extractAttribute` and
`packages/activerecord/src/associations/join-dependency/join-association.ts:272`
`nodeReferencesTable` both encode it by hand.

This is invisible in the signature (`(attr: Node) => unknown`), so a caller
that forgets to return `true` silently halts traversal after the first
attribute — a latent bug for any multi-child `Nary` / `HomogeneousIn`
predicate.

## The audit result (2026-08-28) — the premise above is wrong

The first acceptance criterion was the audit, and the audit disproves the
Context. The boolean protocol is load-bearing AND it is Rails', not a trails
invention:

- `nary.rb:22` is
  `children.any? && children.all? { |child| child.fetch_attribute(&block) }`.
  `all?` tests what the block returns, so a Ruby block that returns a falsy
  value stops the traversal exactly as trails' `false` does. The Context cites
  `nary.rb:21` — the `def` line — and reads the body as a plain `each`.
- Two Rails callers use `fetch_attribute`'s own return value directly:
  `join_association.rb:61`
  (`!Arel.fetch_attribute(node) { |attr| attr.relation.name == table.name }`)
  and `where_clause.rb:181`
  (`... || Arel.fetch_attribute(node) { |attr| attrs.include?(attr) || ... }`).

So there is no convention to remove and no deviation to receipt. What was real
is the second half of the finding: the contract was invisible in
`(attr: Node) => unknown` returning `unknown`.

## Acceptance criteria

- ~~Audit whether the boolean protocol is load-bearing~~ — done above; it is,
  and it is Rails'.
- Type the protocol explicitly (`=> boolean`, not `=> unknown`) across
  `Arel.fetchAttribute`, the node implementations, and every caller.
- ~~Document it once at the `Node#fetchAttribute` declaration site.~~ Dropped,
  for two independent reasons: there is no deviation left to document, and
  since 2026-08-27 the repo forbids the note. `blazetrails/no-freeform-comments`
  (`eslint/no-freeform-comments.mjs`) deletes English comments _and_ Rails
  citations — its header retires `Mirrors:` lines and `.rb:LINE` references by
  name — keeping only `@internal` / `@noRailsEquivalent` / `@missingRailsCall` /
  `@missingRailsArgs` / `@empty` / `@deprecated` and their permanence token.
  A `@noRailsEquivalent` receipt is not the substitute: `Node#fetchAttribute`
  HAS a Rails counterpart (`node.rb:155`), so the tag never flags and
  `extra-surface.ts` scores it STALE. The rule's own rationale is that the
  signature carries it, and the explicit `=> boolean` now does.
- No behaviour change: `where-clause`, `merging`, `or`, `and`, `where-chain`,
  and `join-dependency` suites stay green.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0113-branch-and-guard-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
