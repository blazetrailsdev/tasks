---
title: "date-api-compare-enrollment"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["move-date-time-to-date-package", "date-c-source-extractor-decision"]
deps-rfc: []
est-loc: 250
pr: 6148
claim: "2026-08-06T01:13:05Z"
assignee: "date-api-compare-enrollment"
blocked-by: null
closed-reason: null
---

## Context

Flips `compareApi` on for the `date` source so the ported surface is finally
measured. **Blocked on `date-c-source-extractor-decision`** — its outcome
determines whether this is a straight flip or a flip plus `UNPORTED_FILES`
entries for the C sources.

Today `packages/i18n/src/date.ts` (2,554 lines) is invisible to fidelity
measurement: `scripts/api-compare/extra-surface.ts:12` walks from each Ruby file
to its expected TS file, so a TS file with no counterpart lands in the
`rubyFile === null` slice (`extra-surface.ts:531`) — counted as extra surface,
never compared method-by-method. It carries 7 `@noRailsEquivalent` tags against a
source tree that does not exist in the repo.

## Acceptance criteria

- [ ] `compareApi: true` for the `date` source's `date` package entry.
- [ ] `UNPORTED_FILES` entries for whatever the spike determined cannot be
      credited, **each with a real reason** — never a seeded placeholder.
- [ ] `pnpm parity:api` delta is non-negative.
- [ ] `pnpm parity:api:extra --package date` run and its output triaged: every extra
      either traced to a Ruby method, folded in, or tagged `@noRailsEquivalent`
      with a reason. **Do not widen an allowlist to absorb the moved code** —
      baselines are only-shrink by construction.
- [ ] The 7 pre-existing `@noRailsEquivalent` tags in `date.ts` re-checked against
      the now-vendored source; stale ones deleted rather than carried forward.
- [ ] `pnpm lint --fix` for the method-order rule, which needs the compare
      manifest to do anything.
