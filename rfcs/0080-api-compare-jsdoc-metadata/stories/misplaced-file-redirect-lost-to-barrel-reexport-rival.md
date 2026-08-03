---
title: "Barrel re-export rivals cost a Ruby file its misplaced-file redirect"
status: done
updated: 2026-08-03
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5982
claim: "2026-08-03T16:11:09Z"
assignee: "misplaced-file-redirect-lost-to-barrel-reexport-rival"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping PR 5977 (`interface-property-signatures-uncounted`), which
made interface property signatures enter the compared surface.

`selectMisplacedFile` (`scripts/api-compare/compare.ts`, near the
`MISPLACED_MIN_HITS` definition) picks the sibling TS file for a Ruby file whose
expected TS path does not exist. It requires three thresholds, the third being
separation: `bestCount >= secondCount * 2`.

The extra recorded members gave a runner-up file enough hits that
`core_ext/integer/inflections.rb` lost its `↦ index.ts` redirect: it went from
`4 3 7 57% ↦ index.ts` to `0 7 7 0% ✗`, taking the overall file count from
779/1029 to 778/1029. The port did not change — `ordinalize` / `ordinal` are
still in `packages/activesupport/src/inflector.ts`, re-exported from `index.ts`.
The heuristic simply declines to guess once a generic-name runner-up appears.

Rails counterpart: `vendor/rails/activesupport/lib/active_support/core_ext/integer/inflections.rb`
(`Integer#ordinalize`, `Integer#ordinal`).

## Acceptance criteria

- `core_ext/integer/inflections.rb` resolves against its real TS home again
  (whether by a `RUBY_FILE_TS_OVERRIDES` entry, a barrel-aware resolution step,
  or a separation rule that does not count barrel re-exports as a rival cluster).
- The chosen fix does not re-open the `deprecator.rb ↦ migration.ts`
  false-positive that the separation threshold exists to block —
  `compare.test.ts` already pins that shape.
- Re-measure the overall `files:` total and state the delta.
