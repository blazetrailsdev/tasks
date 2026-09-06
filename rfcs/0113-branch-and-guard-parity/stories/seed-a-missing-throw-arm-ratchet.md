---
title: "seed-a-missing-throw-arm-ratchet"
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

`remeasure-arm-noise-floor-per-token` re-ran the RFC 0113 noise-floor
measurement after the six extractor stories landed, stratified by token, and
wrote it up in trails' `docs/infrastructure/arm-mismatch-noise-floor.md`
("Second measurement — 2026-09-05").

The whole population still cannot gate (75.0% non-real, n=80, seed 113), and
neither can the `if` stratum (70.0% non-real, n=80, seed 113) — `if` is 1,891 of
the 2,141 rows, so it IS the noise floor.

The **missing-`throw`** stratum is the opposite. All 69 rows whose `missing`
names `throw` were read in full: **61 real (88.4%), 8 lowering artefact
(11.6%), 0 extraction bugs**. The 95% interval on the non-real rate is
4.1%–19.1%, entirely under RFC 0113's pre-committed ⅓ tripwire. A dropped raise
is a real divergence 9 times in 10, which is what RFC 0113's Rollout Phase 5
assumed and this measurement now shows.

The eight artefacts are two named classes and nothing else:

- `throw(:abort)` lowered to `return false` / `throwAbort()` — the settled
  trails callback-halt idiom (`has_many_association.rb:22`,
  `has_one_association.rb:18`, `has_one_association.rb:35`,
  `autosave_association.rb:213`), plus `throw(:exception, …)` →
  `throwException(…)` (`i18n/backend/base.rb:47,54`).
- Ruby-only guards with no JS counterpart at all: `require "bcrypt" rescue
LoadError` (`secure_password.rb:120-124`), `constantize` / `NameError`
  (`request.rb:98-103`), and the raise-to-build-a-backtrace trick
  (`error_reporter.rb:258-263`).

RFC 0095 is the precedent for gating one stratum and leaving the rest
report-only: it gates `shape` rows and reports `naming` rows.

## Acceptance criteria

- [ ] A ratchet gates the rows whose `missing` includes `throw`, over its own
      per-package/per-file marks, only-shrink like every other trails ratchet —
      no reseed verb, a `tighten` verb that writes marks DOWN only.
- [ ] The `if`, `loop`, `try` and `rescue` strata stay report-only;
      `parity:api:arms:report` is unchanged.
- [ ] The two artefact classes above are suppressed at the source rather than
      baselined: a `throw(:abort)` / `throw(:exception, …)` whose port calls the
      settled halt helper does not count as a missing `throw`.
- [ ] Marks are seeded from the CURRENT measurement, and the seed run's figures
      are recorded in `docs/infrastructure/arm-mismatch-noise-floor.md`.
- [ ] A `package.json` script and a CI step, wired the way
      `parity:api:calls` is.
