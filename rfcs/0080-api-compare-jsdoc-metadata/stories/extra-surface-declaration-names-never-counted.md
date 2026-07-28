---
title: "Declaration names are absent from the extra set, so declaration-level tags only match by accident"
status: ready
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
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

Found while shipping PR 5467 (`extra-surface-skip-duck-typed-interface-members`).

`collectTsFileNames` (`scripts/api-compare/extra-surface.ts`) collapses a TS
file's public surface to a Set of MEMBER names — it iterates each class's and
module's `instanceMethods` / `classMethods` plus `fileFunctions`, and never
adds the container's own `name`. So a class / interface / namespace DECLARATION
name is not extra surface as far as the report is concerned.

That makes the declaration-level `@noRailsEquivalent` form added in PR 5462
matchable only by accident: it matches when the declared name ALSO appears as a
member somewhere in the same file (e.g. `NullPool.NullConfig`, a static
re-attachment), and is reported STALE otherwise. Two consequences already
observed:

- `NullConfig` (`connection-adapters/abstract/connection-pool.ts`) failed
  `api:extra` on main as a stale tag; PR 5467 demoted its reason to prose
  because there was nothing for the tag to match.
- A tagged `interface` cannot have its own name matched at all, which is why
  PR 5467 has to flag the interface's own-name entry `inherited` to keep the
  stale check from demanding its deletion.

Either the extra set should include declaration names (making the PR 5462 form
load-bearing and the `inherited` exemption for interface own-names removable),
or the declaration-level form should be documented as covering members only and
the stale check taught not to expect a match for it. Today it is neither.

## Acceptance criteria

- Decide and encode whether a class / interface / namespace declaration name is
  extra surface.
- If declaration names start counting, re-measure: the totals in
  `api:extra` will move, and the `inherited` exemption on interface own-name
  entries in `collectTaggedEntries` should be revisited.
- `NullConfig`'s reasoning (currently prose at connection-pool.ts) returns to a
  real tag if the answer is that it does count.
- `pnpm api:extra` exits 0 with no stale tags either way.
