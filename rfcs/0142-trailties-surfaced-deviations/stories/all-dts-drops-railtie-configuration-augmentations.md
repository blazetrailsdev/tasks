---
title: "all-dts-drops-railtie-configuration-augmentations"
status: in-progress
updated: 2026-11-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9601
claim: "2026-11-02T00:27:46Z"
assignee: "all-dts-drops-railtie-configuration-augmentations"
blocked-by: null
closed-reason: null
---

## Context

trails#9543 (0c51ef60ef) rewrote `packages/trailties/src/all.ts` from static
`import "./trailties/action-controller.js"` lines to `import()` thunks driven by
`rbFRequire`, so an absent engine is a skipped `LoadError` as in Rails'
`railties/lib/rails/all.rb`. Runtime is fine, but `dist/all.d.ts` now contains
only `import "./rails.js"`. The railtie modules hold the
`declare module` `interface Configuration` augmentations
(`packages/trailties/src/trailties/action-controller.ts:46`, `action-view.ts:44`,
`active-record.ts:71`, `active-job.ts:38`), so they leave the consumer's program.

Any application with `import "@blazetrails/trailties/all"` loses
`config.activeRecord`, `actionController`, `actionView` and `activeJob`:
trailmap gets 9 TS2339 errors in `config/environments/*.ts` at trails 38bcb20613
(`trailmap#108`-era bump). `trails new` output has the same shape.

## Acceptance criteria

- `dist/all.d.ts` keeps every framework `Configuration` augmentation in a
  consumer's program, without making an optional engine a static runtime import.
- A test in trailties typechecks `config.actionController` and the other three
  against the built declarations of `./all`.
- trailmap's `pnpm build --noEmit` is clean once re-vendored.
