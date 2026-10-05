---
title: "The thor-only CI lane scores extra surface differently from the full lane (moved credit comes from other gems)"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
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

`scripts/ci/thor-comparison.sh` (the lane a thor-only diff gets, selected by `scripts/ci/thor-only.sh`) narrows `LIB_PATHS_JSON` to thor, so `extract-ruby-api.rb` writes a `rails-api.json` holding thor's Ruby surface only. `scripts/api-compare/extra-surface.ts` decides `moved` versus `novel` from one global map of every camelized Ruby name in that artifact (see its `ExtraKind` JSDoc, "moved is decided by a single global map"). So the same TS name scores differently in the two lanes:

- Full lane: `Thor.Group` (`packages/trailties/src/thor/thor.ts`, `declare static Group`) scored `moved`, credited to `arel nodes/unary.rb Group`, and `Thor`'s `constructor` to `Arel::Attributes::Attribute#initialize`.
- Thor-only lane: `Group` scored `novel`. thor is pinned at novel 0 (`scripts/api-compare/extra-surface-mark.json`), so the lane was red on main's own thor files for the first thor-only PR (trails#8509, run 37244611329), although every full-lane run before it was green.

trails#8509 cleared that one name with a `@noRailsEquivalent CONVERGEABLE port-thor-group` receipt. The lane disagreement itself remains: a thor name that passes the full lane only because another gem happens to define a same-named member reds the next thor-only PR, whose author did not touch it.

## Acceptance criteria

- [ ] The thor-only lane and the full lane score every thor extra the same way. Either the `moved` credit for a thor file is restricted to thor's own Ruby names in BOTH lanes (so a cross-gem short-name coincidence is `novel` everywhere and is receipted or removed once), or the thor-only lane compares against the full Ruby surface.
- [ ] A test in `scripts/` pins it: the extra-surface gate's verdict for `--package thor` does not change with which other packages the artifact holds.
- [ ] `Thor`'s `constructor`, today credited off arel, is receipted, removed, or shown to be credited by a thor name.
