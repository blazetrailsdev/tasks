---
title: "Split unported-files.ts into a per-package directory"
status: done
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6340
claim: "2026-08-10T15:03:46Z"
assignee: "unported-files-split-per-package"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files.ts` is 1,479 lines holding a single
`UNPORTED_FILES: UnportedFile[]` array (`:46`–`:1433`) of ~154 exclusion
entries, plus the three predicates every parity consumer actually imports:
`isSourceUnported` (`:1435`), `isTestFileUnported` (`:1451`),
`isTestCaseUnported` (`:1466`). The entry schema is documented in the header
comment (`:1`–`:32`) and typed by the `UnportedFile` discriminated union
(`:34`).

It is the same monolith-register problem RFC 0097 is about: every agent that
excludes a Ruby file appends to the bottom of one array, so parallel stories
conflict on the same hunk. Unlike the JSON registers this RFC shards, this one
is a TypeScript module, so the shard mechanism is ESM modules + a merging
index, not `writeSplitBaseline`.

Consumers import the package subpath, never the array:

- `scripts/api-compare/compare.ts:126` — `isSourceUnported`
- `scripts/api-compare/extra-surface.ts:102` — `isSourceUnported`
- `scripts/test-compare/compare.ts:68` — `isTestFileUnported`, `isTestCaseUnported`
- `scripts/parity/package.json:11` — `"./unported-files": "./unported-files.ts"`

In-repo tests over the array:

- `scripts/parity/unported-files.test.ts:109` — `UNPORTED_FILES` schema tests
- `scripts/parity/unported-overmatch.test.ts:31` — whole-file `testFile`
  entries must not overmatch the vendored Rails test tree

### The wrinkle

Only 48 of ~154 entries carry an explicit `package` (activesupport 13, i18n 20,
did-you-mean 11, date 2, globalid 1, activerecord-test-support 1). The other
~106 are deliberately unscoped, and the header comment is explicit that
"Unscoped entries match across all packages"; `package` is documented as
required only when the same basename exists in more than one package
(`core_ext/name_error.rb`, `railtie_test.rb`).

So a naive per-package split is a behaviour change. Adding `package:` to an
entry that lacks one narrows what parity:api / parity:test exclude — a silent
parity movement. No entry may gain or lose a `package` field in this work.

## Acceptance criteria

- [ ] `scripts/parity/unported-files/` holds one module per `package` value
      plus one module for the entries that carry no `package`, and an
      `index.ts` that re-exports the merged `UNPORTED_FILES` and the three
      `is*Unported` predicates unchanged.
- [ ] The schema header comment and the `UnportedFile` type have exactly one
      home; they are not copied into the per-package modules.
- [ ] `scripts/parity/package.json`'s `"./unported-files"` subpath still
      resolves. No consumer import line changes; no new cross-package subpath
      is added.
- [ ] Entries are moved verbatim: no `package` field added or removed, no
      reason string reworded, no entry edited. Anything found wrong with an
      entry is filed as its own story, not fixed here.
- [ ] A test proves the split is behaviour-preserving against a snapshot of the
      pre-split array captured entry-for-entry — not an entry count.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas are exactly zero in both
      directions.
