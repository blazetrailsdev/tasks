---
title: "actionpack: the .builder handler is ported; unpark the builder template tests"
status: in-progress
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: actionpack
packages: [actionpack, actionview, scripts]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#10512
claim: "2026-11-21T18:29:36Z"
assignee: "retake-the-body-pin-floor-at-the-last-8-0-2-commit"
blocked-by: null
closed-reason: null
---

## Context

Eleven actionpack tests and action-pack-assertions' three "rendering xml"
tests are parked because `template/handlers/builder.rb` is "unported". It is
ported: `packages/actionview/lib/template/handlers/builder.ts`, registered at
`handlers.ts:44` (`handlers.rb:16`), and `@blazetrails/builder` passes 98/98.
The row `scripts/parity/unported-files/actionview.ts:30-38` is stale, and
`helpers/atom_feed_helper.rb` (`:40-48`) rests on the same claim.

## Acceptance criteria

- [ ] The `builder.rb` unported-files row is deleted; the `atom_feed_helper.rb` row is re-checked and deleted or re-reasoned.
- [ ] The 14 tests run as the Rails bodies with `.builder` fixtures and pass.
- [ ] `action-pack-assertions-port-render-file-tests-and-park-the-builder-three`'s park criterion is rewritten to drop the builder half.

## Verification

```sh
pnpm parity:test --missing --package actionpack && grep -c "builder" scripts/parity/unported-files/actionview.ts
```
