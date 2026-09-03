---
title: "map-remaining-trailtie-files-cross-package"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
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

`port-activerecord-trailtie-file` (PR pending) added
`RUBY_FILE_CROSS_PACKAGE_OVERRIDES` to `scripts/parity/conventions.ts` and
plumbed it through `scripts/api-compare/compare.ts` (member index and the
file-existence check), so `activerecord:railtie.rb` is scored against
`packages/trailties/src/trailties/active-record.ts` instead of a
`packages/activerecord/src/trailtie.ts` that will never exist. That took
activerecord to `files: 281/281`.

The mechanism is deliberately general, and the table has exactly one row
today. The other six trailties are the same shape:

| Ruby file                                 | trails port                                             |
| ----------------------------------------- | ------------------------------------------------------- |
| `activemodel:railtie.rb`                  | `packages/trailties/src/trailties/active-model.ts`      |
| `activesupport:railtie.rb`                | `packages/trailties/src/trailties/active-support.ts`    |
| `actionpack:action_controller/railtie.rb` | `packages/trailties/src/trailties/action-controller.ts` |
| `actionpack:action_dispatch/railtie.rb`   | `packages/trailties/src/trailties/action-dispatch.ts`   |
| `actionview:railtie.rb`                   | `packages/trailties/src/trailties/action-view.ts`       |
| `globalid:railtie.rb`                     | `packages/trailties/src/trailties/global-id.ts`         |

The actionpack rows need checking against `PACKAGE_SRC_SUBDIR` /
`PACKAGE_DIRS` in `scripts/api-compare/config.ts` — actionpack is four
api-compare packages under one directory, so the Ruby package key and the
`railtie.rb` path both differ from the activerecord row.

## Acceptance criteria

- Each of the six Ruby `railtie.rb` files above resolves, via a row in
  `RUBY_FILE_CROSS_PACKAGE_OVERRIDES`, to its `packages/trailties/src/trailties/*.ts`
  port, with a `scripts/parity/conventions.test.ts` case and
  `docs/ruby-ts-conventions.md` regenerated (never hand-edited).
- Each affected package's `files: N/M` improves, or the row is shown to be
  already credited and the entry is skipped with a note.
- `pnpm parity:api:extra:gate`, `parity:api:calls`, `:calls:args`, `:params`
  stay green; no `unported-files` row is added or widened.
- Any member a newly-mapped row now expects but the trailties file lacks
  (the `instrument` shape on the activerecord row) is landed through the
  ported mixin, not as a second copy of its body.
