---
title: "extra-surface: allowlist entries need kind (tooling-gap vs deviation) and a story id"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing `extra-surface-adapter-cross-file-recurring-names` (PR 5345).

`scripts/api-compare/extra-surface-allow.json` entries are a flat
`{package, tsFile, name, reason}`. Nothing in the format distinguishes two
populations that need opposite treatment, and the metric counts them
identically:

1. **Tooling gaps** — trails IS Rails-faithful, the comparator cannot see it.
   Audited 2026-07-26: roughly 22 of 45 entries. Causes: `define_method` loops
   and `define_column_methods` (15 entries, see
   `extractor-capture-define-method-loop-surface`), nested-class method scoring
   (see `extra-surface-nested-class-methods-scored-asymmetrically`),
   `include Comparable` (see `extra-surface-admit-stdlib-comparable-operators`),
   `database.yml` config keys (see `extra-surface-decide-config-key-accessors`).
   An entry here permanently blesses a comparator bug and teaches the next agent
   to add entry N+1 instead of fixing the tool.
2. **Real divergence** — trails invented surface. Belongs in a convergence
   story, and the entry should be deleted when that story lands.

Because both read the same, a burndown that converts drift into entries looks
like convergence. On PR 5345 a 61 to 22 novel-count reduction across five
adapter files was really 9 names removed and 26 suppressed; the entries for
names with a registered convergence story were subsequently dropped (final:
61 to 32, 16 entries) precisely because suppressing already-scheduled deletions
is churn.

Proposal: require `kind: "tooling-gap" | "deviation"` on every entry, plus a
`story` id when `kind` is `deviation`, validated by `findInvalidAllowEntries`
alongside the existing non-empty-reason check. Then tooling-gaps become a bug
queue that drains to zero, deviations become tracked debt with a burndown, and
neither can masquerade as convergence in whatever the stats DB reports.

Note `user_api_test_compare_outputs_feed_stats_db`: these outputs feed the stats
pipeline, so any schema change must keep the report emitting rather than hard-
failing on a malformed file — mirror the existing degrade-then-exit-code
behaviour in `main()`.

## Acceptance criteria

- `kind` is required on every entry and validated; `story` is required when
  `kind` is `deviation` and is checked to resolve against the tasks repo (or at
  minimum to be non-empty and well-formed).
- Existing entries are classified in one pass; the classification for each is
  defensible from its existing reason text.
- The report distinguishes the two totals so a tooling-gap count and a deviation
  count can be tracked separately.
- A malformed allowlist still prints the full report before setting a non-zero
  exit code, as today.
- Tests in `scripts/api-compare/extra-surface.test.ts`.
