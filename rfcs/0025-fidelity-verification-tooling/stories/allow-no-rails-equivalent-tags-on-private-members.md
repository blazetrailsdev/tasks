---
title: "parity:api:extra rejects @noRailsEquivalent on private / _-prefixed members, so that deviation class cannot be reviewed"
status: draft
updated: 2026-08-19
rfc: "0025-fidelity-verification-tooling"
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

# `parity:api:extra` rejects a `@noRailsEquivalent` tag on any `_`-prefixed or private member, so that whole class of deviation cannot be reviewed

## Context

Found while shipping `tag-relation-async-machinery-no-rails-equivalent` in PR
PR #6735. The story's whole point was to put reviewed `@noRailsEquivalent` reasons
on three untagged private members of `relation.ts` (`_loadAsyncPromise`,
`_asyncLoad`, `_loadToken`). Applying the tags reddened the gate:

```text
extra-surface: 3 STALE @noRailsEquivalent tag(s) on methods that no longer
flag as extra surface — ... the declaration is internal or `_`-prefixed
(never counted) ...
  - activerecord  relation.ts  _loadAsyncPromise
  - activerecord  relation.ts  _asyncLoad
  - activerecord  relation.ts  _loadToken
```

and, separately, demanded a permanence claim on the same member it had just
declared untaggable.

So the tool is self-consistent but the policy has a hole: `extra-surface.ts`
never SCORES a `_`-prefixed or private member, and therefore treats any tag on
one as stale. CLAUDE.md names `@noRailsEquivalent` as "the only sanctioned
exception" for invented surface and says "the reason is reviewed" — but for
private members there is no way to record a reviewed reason that the tooling
accepts. The PR worked around it by writing the same content as prose
(`**No Rails equivalent — PERMANENT.** ...`), which no gate can see, count, or
burn down.

That is exactly why those three members sat undocumented long enough to need a
story: private invented state is invisible to the one mechanism that measures
invented state.

## Converged shape

Let `@noRailsEquivalent` attach to a private / `_`-prefixed declaration without
being reported stale, and count those tags in a separate, reported-only bucket
(they are not extra PUBLIC surface, so they must not move the novel/moved
score). The permanence-claim check should apply to them as it does to the
scored ones, so `PERMANENT` vs `CONVERGEABLE` stays reviewable.

At minimum, the stale-tag message should stop naming a case it will never
accept a fix for.

## Acceptance criteria

- [ ] A `@noRailsEquivalent` tag on a private or `_`-prefixed declaration does
      not report as STALE.
- [ ] Such tags are counted and listed in their own bucket, and do NOT change
      any package's novel / moved / total numbers.
- [ ] The permanence-claim check still applies to them.
- [ ] `relation.ts`'s three async members are converted from the prose
      workaround back to real tags, as
      `tag-relation-async-machinery-no-rails-equivalent` intended.
- [ ] `scripts/api-compare` unit tests cover both the private-tag and the
      public-tag paths.
