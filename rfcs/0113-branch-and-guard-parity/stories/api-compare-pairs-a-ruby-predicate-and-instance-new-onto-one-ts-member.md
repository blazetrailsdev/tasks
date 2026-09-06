---
title: "api-compare-pairs-a-ruby-predicate-and-instance-new-onto-one-ts-member"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
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
closed-reason: null
---

## Context

`remeasure-arm-noise-floor-per-token`'s 80-row whole-population sample turned up
two rows — 2.5% — that are neither real divergences nor lowering artefacts: the
two bodies compared are not counterparts at all. Both are pairing defects in
`scripts/api-compare`, not skeleton defects, so they inflate every report built
over the manifest, not just the arms one. Written up in trails'
`audits/arm-mismatch-noise-floor-20260906T022720Z.md`, "Gap inventory" 2-4.

1. **A Ruby predicate pairs onto its own bare-named sibling.**
   `actionview/lib/action_view/helpers/capture_helper.rb` defines both
   `content_for` (`:172`) and `content_for?` (`:215`). Both pair to
   `contentFor` (`packages/actionview/src/helpers/capture-helper.ts:36`),
   because the port spells the predicate `contentForQuestion` (`:90`), which is
   not among the candidates `docs/ruby-ts-conventions.md` produces for a
   predicate (`isContentFor` / `contentFor` / `contentForQ`). The one-line
   `content_for?` is then scored against the 30-line `content_for` port and
   reports seven invented `if`s.
   `docs/ruby-ts-conventions.md:33-36` already says a predicate whose Ruby file
   ALSO defines the bare name offers the quoted-literal spelling FIRST — but the
   bare camel candidate is still offered, so it wins when nothing better
   matches. Nothing stops two Ruby members claiming the same TS member.

2. **`initialize` and an instance `new` both claim `constructor`.**
   `actionpack/lib/action_controller/renderer.rb` defines `Renderer#new`
   (`:72`, a three-line delegation) and `Renderer#initialize` (`:111`). The
   conventions table maps BOTH spellings to `constructor`, so both pair to
   `packages/actionpack/src/action-controller/renderer.ts:13`.

The same shape shows up without being separately classifiable, as one TS member
scored once per Ruby file that defines the name:
`activerecord/base.ts#delete` (paired to `base.rb` and `persistence.rb`),
`actionpack/.../base.ts#allowBrowser` (`base.rb` and `metal/allow_browser.rb`),
`trailties/.../model-generator.ts#constructor` (`generators/model_helpers.rb`
and `generators/rails/model/model_generator.rb`).

## Acceptance criteria

- [ ] A TS member is claimed by at most ONE Ruby member per (package, tsFile,
      tsName). When two Ruby names resolve to the same TS member, the better
      match wins and the loser is reported as unpaired rather than scored
      against someone else's body.
- [ ] `content_for?` no longer pairs to `contentFor`; either
      `contentForQuestion` becomes a recognised predicate candidate or the port
      is renamed to a candidate the table already produces. Pick one and say
      which in the PR — do not add both.
- [ ] `Renderer#new` no longer pairs to `constructor` when the same Ruby file
      also defines `initialize`.
- [ ] The cross-file duplicates above collapse to one row each.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas are non-negative and the
      call / arg / extra ratchets stay green; a row count that DROPS is the
      expected outcome and the affected marks are tightened, never reseeded.
