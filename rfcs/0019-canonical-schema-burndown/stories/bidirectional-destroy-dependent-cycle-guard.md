---
title: "bidirectional-destroy-dependencies → canonical fixtures (needs dependent-destroy cycle guard)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`.
`associations/bidirectional-destroy-dependencies.test.ts` stays on the
`require-canonical-schema` exclude list because a faithful canonical port is
blocked on a framework gap, not a schema/fixtures issue.

The canonical `test-helpers/models/content.ts` faithfully mirrors Rails:
`Content has_one :content_position, dependent: :destroy` AND
`ContentPosition belongs_to :content, dependent: :destroy` — mutual
dependent-destroy. trails `belongs-to-association.ts#handleDependency` calls
`target.destroy()` with no already-destroyed re-entrancy guard, and
`Persistence#destroy` has none either, so destroying either side recurses
forever (worker OOMs at 4 GB). Rails breaks the cycle; trails does not. The
current (excluded) test sidesteps this with inline `makeModels()` where
belongs_to dependent-destroy does not actually cascade, keeping the
`belongs to association` case `it.skip`ped.

There is also a latent bug in `content.ts`: its `beforeDestroy`/`afterInitialize`
callbacks use `function (this: X)` and read `this.id`, but trails invokes
callbacks as `cb(record)` (this unbound) -> `Cannot read properties of
undefined`. Fix to take the `record` param.

## Acceptance criteria

- [ ] Add an already-destroyed/in-progress re-entrancy guard so mutual
      `dependent: destroy` terminates (mirrors Rails).
- [ ] Fix `content.ts` callbacks to use the `record` param, not `this`.
- [ ] Port `bidirectional-destroy-dependencies.test.ts` onto canonical
      `Content`/`ContentPosition` models + `content`/`content_positions`
      fixtures; un-skip the `belongs to association` case; bodies match
      `bidirectional_destroy_dependencies_test.rb` word-for-word.
- [ ] `pnpm vitest run` passes; file removed from the exclude JSON.
