---
title: "Classify the 17 @noRailsEquivalent tags carrying no permanence claim"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
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

`@noRailsEquivalent` is required to open its reason with `PERMANENT` or
`CONVERGEABLE` — `scripts/api-compare/extra-surface.ts:836-837` says a tag
stating neither fails the run, and `extra-surface.ts:2007-2008` reports the
rest as `unclassified` so the burndown cannot tell permanent debt from
convergence work.

**17 tags on `origin/main` (9415a63a9) carry no permanence claim**, e.g.

```
@noRailsEquivalent Ruby needs no name for a duck type.
@noRailsEquivalent Peels Ruby's trailing `parameters:` keyword back off the …
@noRailsEquivalent Serves trails' awaitable `serializable_hash` (RFC 0022 b2).
@noRailsEquivalent Module-private message helper for `ModelName#match`'s …
@noRailsEquivalent Rails needs no such hook: its readers are methods, so …
@noRailsEquivalent Port of the Ruby stdlib primitive `@lock.new_cond` …
@noRailsEquivalent SecureRandom.random_number is Ruby stdlib, not a Rails …
```

Find them all with:

```
git grep -hoE '@noRailsEquivalent [^*]*' -- 'packages/*/src/*' \
  | grep -vE 'PERMANENT|CONVERGEABLE'
```

`no-freeform-comments` deliberately **leaves these verbatim** (PR #7132):
there is no data to reduce them to, a bare tag fails the empty-reason contract
at `scripts/api-compare/build.ts:24`, and inventing a permanence token would
fabricate a reviewed judgement. So they are the one class of comment the sweep
cannot touch, and they stay full English until a human classifies them.

## The work

Each tag is a judgement, not a mechanical edit — read the declaration and the
Rails counterpart before choosing:

- **`PERMANENT`** — a language- or runtime-level fact no port can remove
  (Ruby stdlib with no JS analogue, a duck type TS must name, an async seam a
  Ruby sync method does not need).
- **`CONVERGEABLE`** — trails invented surface that Rails does have some form
  of, or that should fold into a ported method. **This is a convergence
  story**: prefer removing the surface over classifying it. A tag reclassified
  `CONVERGEABLE` should get a follow-up story naming the Rails
  `gem/path.rb:LINE` it converges toward.

Once classified, the sweep reduces each to `@noRailsEquivalent PERMANENT` /
`@noRailsEquivalent CONVERGEABLE` on its next run, which is the point.

## Acceptance criteria

- [ ] Every `@noRailsEquivalent` in `packages/*/src/**` opens its reason with
      `PERMANENT` or `CONVERGEABLE`; the grep above returns nothing.
- [ ] No permanence token is asserted without reading the declaration and its
      Rails counterpart; each `CONVERGEABLE` names the Rails `path.rb:LINE`.
- [ ] Surface that can simply be deleted is deleted rather than classified.
- [ ] `pnpm parity:api:extra --package <pkg>` reports no `unclassified` for the
      touched packages; `parity:api:extra:gate` stays at arel novel 0/0.
- [ ] `pnpm lint` clean.
