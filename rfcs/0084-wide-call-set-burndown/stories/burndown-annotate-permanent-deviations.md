---
title: "B2: migrate permanent deviations to @missingRailsCall tags"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 350
pr: 6364
claim: "2026-08-11T15:53:36Z"
assignee: "burndown-annotate-permanent-deviations"
blocked-by: null
closed-reason: null
---

## Context

Two groups of wide-ratchet entries are permanent and correct, and will never
converge:

- **~30 `synchronize` rows.** Ruby guards the body with `Mutex#synchronize`;
  trails is single-threaded and has no mutex. Several already carry exactly this
  reason in the baseline.
- **The 349 entries already carrying real per-entry justifications** — RFC 0032
  wide-entry verification, RFC 0072 syntax-only, Rack header accessors,
  constructor idiom (`X.new` → `new X()`), and confirmed equivalents.

They currently sit in `scripts/api-compare/call-mismatches-wide-exclude/`
forever. This story moves them to reasoned `@missingRailsCall` tags at the call
site, which is where a deviation's justification belongs.

**Hard-blocked** on `missing-rails-call-tag-suppresses-wide-flag` in
`0083-wide-call-ratchet-noise-reduction`: today nothing in `compare.ts` or
`lint-call-mismatches-wide.ts` reads the tag, so annotating cannot remove a
baseline entry.

## Acceptance criteria

- Every migrated entry carries a specific, non-empty reason. A bulk copy of the
  `DEFAULT_REASON` seed string is NOT acceptable — an entry that cannot state
  why it is permanent is convergeable work and belongs in another bundle.
- Apply the RFC 0080 `audit-existing-tags-for-convergeable-surface` test: before
  tagging, confirm the entry is genuinely permanent. That audit found all 15
  candidate entries were convergeable and deleted them rather than tagging;
  expect the same scrutiny here.
- Migration runs through `parity:api:build`, not by hand-editing both sides.
- Split into ~2 PRs (synchronize group; verified-equivalents group).
- Depends on: missing-rails-call-tag-suppresses-wide-flag (other RFC).

- **Check for an existing owner before claiming any slice.** The 2026-07-30
  survey found that 42% of open fidelity stories already own a file the wide
  list flags. If an open story in another RFC owns the file, the wide row
  belongs there as an acceptance criterion — not in a second campaign against
  the same file.
