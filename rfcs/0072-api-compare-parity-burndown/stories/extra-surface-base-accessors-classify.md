---
title: "extra-surface: classify the base.ts novel surface, anchored on loadBelongsTo/loadHasOne"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `extra-surface-associations-engine-classify` (PR #5341), which
classified `associations.ts` from 26 novel extras down to 19. That work
explicitly scoped OUT an adjacent finding, which this story picks up.

`packages/activerecord/src/base.ts` is rank #5 in
`pnpm api:extra --package activerecord --novel-only` with **19 novel, 0 moved**:

```text
adapterClassSync         attributeNamesList       attributeSetCoder
ensureSchemaLoaded       findByAttribute          hasAttributeDefinition
isEqual                  isSuppressed             isTouchingSuppressed
loadBelongsTo            loadHasOne               loadSchemaFromAdapter
new                      respondToMissingFinder   setDestroyedByAssociation
toSlug
```

### The anchor finding: `loadBelongsTo` / `loadHasOne` instance accessors

These are NOT the `associations.ts` engine functions of the same name (those
are handled by the `extra-surface-relocate-load-*` stories). They are separate,
public **instance methods** on every model:

- declared at `base.ts:4676` (`loadBelongsTo(name: string): Promise<Base | null>`)
- implemented at `associations/instance-methods.ts:155`
- documented as user-facing at `associations/singular-association.ts:50-80`

Rails has no analogue. In Ruby you just call `post.author` and the reader
blocks on I/O. trails cannot, so it invents an explicit async load path
(`post.loadBelongsTo("author")`) that doubles as the **strict-loading escape
hatch** — `instance-methods.ts:104` notes explicit calls bump a bypass count
for the duration of the load, so they are treated as legitimate lazy loads.
That is real, deliberate, documented behavior, not accidental surface.

So this is very likely category (b) allowlist-with-reason rather than (a) or
(c) — but the reason has to be written down, and the same judgement has not
been made for the other 16 names.

### Note on the mixin-host names

`attributeNamesList`, `isEqual` and `toSlug` appear here even after the
`__mixin` host-leak fix (#5336). On `associations.ts` those three WERE pure
host-interface artifact and dropped out; on `base.ts` they are genuinely
declared, so they need real classification rather than being assumed to
evaporate. Do not carry the `associations.ts` assumption over.

## Acceptance criteria

- A per-name classification of all 19 `base.ts` novel extras into:
  (a) invention to remove, (b) allowlist / `@internal` with a written reason,
  (c) misplaced port with the target Rails-layout TS file named.
- `loadBelongsTo` / `loadHasOne` specifically get a written verdict covering
  the async-reader and strict-loading-bypass roles described above.
- Every "no Rails counterpart" claim is verified by grepping the snake_case
  name as a Ruby `def` across the whole of `vendor/rails`, and every positive
  Rails reference carries a `file:line`. (This is what took #5341 from
  reasoned-but-unverified to verified; two of its citations were wrong on the
  first pass and only the grep caught them.)
- (b) verdicts applied in this PR (`@internal` tag, or an entry in
  `scripts/api-compare/extra-surface-allow.json` when the name is public by
  intent and `@internal` would be a lie).
- (c) verdicts registered as follow-up stories carrying name lists and
  `base.ts:<line>` refs. Do NOT open sibling PRs.
- Record `base.ts` novel before/after in the PR body.
- Re-run `pnpm api:calls:wide` — `@internal` changes what `extract-ts-api`
  emits and that ratchet has gone stale on exactly this before.
- No test renames. No `node:*` imports. No `process.*` references. Async fs
  only. camelCase only.
- Under the 500 LOC ceiling. NO stacked PRs — single PR from `main`.
