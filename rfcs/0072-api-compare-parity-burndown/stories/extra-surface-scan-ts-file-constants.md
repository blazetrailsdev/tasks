---
title: "extra-surface: scan TS module-level fileConstants (currently unscored)"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while implementing `extra-surface-allow-ruby-file-constants` (PR #5338).

That PR taught the _Ruby_ side of extra-surface scoring about constants:
`collectAllowedNames` and `buildGlobalRubyCandidates`
(`scripts/api-compare/extra-surface.ts`) now union `rubyPkg.fileConstants`.
The **TypeScript** side has the mirror-image blind spot and it was left
untouched: `collectTsFileNames` (`scripts/api-compare/extra-surface.ts:395`)
only walks `classes[].instanceMethods` / `classMethods` and
`tsPkg.fileFunctions`. It never reads `tsPkg.fileConstants`, which the TS
extractor does populate (`scripts/api-compare/extract-ts-api.ts:654-655`).

Consequence: a module-level `export const FOO = …` in a TS file is invisible to
extra-surface scoring entirely — it can never be reported as drift no matter
how invented it is. The constants PR only moved the needle because the ported
Rails constants happen to be authored as `static` class members, which surface
through `classMethods`. Same-named constants written at module scope are
silently exempt, so the audit under-reports by an unknown amount.

This is under-reporting, not a false positive, so it is not urgent — but it
means the activerecord novel count (741 after #5338) is a floor, not a
measurement.

## Acceptance criteria

- `collectTsFileNames` includes `tsPkg.fileConstants[file]` names, subject to
  the same filters the method path applies (`internal`, `_`-prefix,
  `TS_ALWAYS_ALLOWED`).
- Confirm the Ruby-side allow-set added by #5338 pairs correctly with them, so
  a module-scope port of `ER_DUP_ENTRY` scores allowed rather than novel —
  i.e. the two sides agree regardless of whether the TS author chose a static
  member or a module const.
- Test in `scripts/api-compare/extra-surface.test.ts`: module-scope TS constant
  matching a Ruby file constant (allowed), matching a constant in another Ruby
  file (moved), and TS-only (novel).
- Record the novel-count delta from `pnpm api:compare && pnpm api:extra
--package activerecord`. Baseline after #5338: activerecord 741 novel /
  2085 moved / 2826 total. Expect novel to _rise_ — this uncovers surface that
  was previously unscored.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
