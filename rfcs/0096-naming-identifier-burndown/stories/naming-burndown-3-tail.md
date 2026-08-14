---
title: "Burn down the last 10 naming call-argument rows in i18n, trailties, did-you-mean and globalid"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["i18n", "trailties", "globalid"]
deps: []
deps-rfc: []
est-loc: 40
pr: 6513
claim: "2026-08-14T11:47:18Z"
assignee: "naming-burndown-3-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 3. Measured on `origin/main` at **059bfe688** (2026-08-12) with
`API_COMPARE_ALLOW_STALE_BUILD=1 API_COMPARE_FORCE=1 pnpm parity:api --calls`
followed by `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`
(the freshness guard reports `OutOfDateWithSelf` for activerecord/activesupport
even after a clean `pnpm build`, so the stale-build escape hatch is required).

That run reports **344 `naming` rows** repo-wide, of which **167** are in RFC
0096's scope. This slot is the whole tail — every remaining in-scope row outside
activerecord, activesupport, activemodel and arel: **10 rows across 7 files** in
i18n (6), trailties (2), did-you-mean (1) and globalid (1). Successor to
wave-2's `naming-burndown-2-tail`; small enough to land in one pass and it
empties four packages.

| Rows | File                                             |
| ---: | ------------------------------------------------ |
|    3 | `packages/i18n/src/backend/base.ts`              |
|    2 | `packages/i18n/src/backend/key-value.ts`         |
|    1 | `packages/i18n/src/backend/flatten.ts`           |
|    1 | `packages/trailties/src/engine/configuration.ts` |
|    1 | `packages/trailties/src/rack/logger.ts`          |
|    1 | `packages/did-you-mean/src/spell-checker.ts`     |
|    1 | `packages/globalid/src/locator.ts`               |

### The rows, with both sides

- **`i18n/backend/key-value.ts#storeTranslations`** — TS passes `subtreesFlag`
  into `flattenTranslations`; the Ruby
  (`vendor/rails/../i18n/lib/i18n/backend/key_value.rb#store_translations`) is
  `flatten_translations(locale, data, escape, subtrees)`. Plain rename,
  `subtreesFlag`→`subtrees`.
- **`trailties/rack/logger.ts#call`** — TS passes `env` to `computeTags`; Rails
  (`railties/lib/rails/rack/logger.rb#call`) passes `request`
  (`compute_tags(request)`), the `ActionDispatch::Request` it built from `env`.
  Read this one: if trails is genuinely passing the raw env where Rails passes a
  Request, it is an a3, not a rename.
- **`trailties/engine/configuration.ts#paths`** — TS `_root`, Rails `root`
  (`railties/lib/rails/engine/configuration.rb#paths`, `Rails::Paths::Root.new(@root)`).
  A field-underscore recording rather than a local rename — same shape as
  activesupport's `cache/entry.ts`.
- **`did-you-mean/spell-checker.ts#correct`** — TS `word`, Rails `c`
  (`did_you_mean/spell_checker.rb#correct`, `normalize(c)`). Plain rename; the
  Rails single letter wins.
- **`globalid/locator.ts#locateManySigned`** — TS `uris`, Rails
  (`globalid/lib/global_id/locator.rb#locate_many_signed`) passes
  `gids.compact`, recorded as `ref:compact`. Chained-call residue, not a
  rename.
- **`i18n/backend/base.ts#loadYml` / `#loadJson` (3 rows)** — TS passes
  `inspectError` where Ruby passes `e.inspect`
  (`i18n/lib/i18n/backend/base.rb`, `raise InvalidLocaleData.new(filename, e.inspect)`),
  plus `readFile` against Ruby `read`. All three are nested-call recordings, not
  renames.
- **`i18n/backend/key-value.ts#translations`** — Ruby `ref:inject` vs TS
  `ref:reduce`; the same chained-call residue as arel's `groupingAny`.
- **`i18n/backend/flatten.ts#resolveLink`** — Ruby `ref:gsub` vs TS
  `ref:replaceAll`. Residue.

### Tooling residue in this slot

This slot is residue-heavy: **6 of the 10** rows (the three `base.ts` rows, the
`key-value.ts` `inject`/`reduce` row, `flatten.ts`, and `locator.ts`) are the
chained-call / nested-call recordings RFC 0096's Motivation documents, not
renames. Only ~3 are plain renames (`key-value.ts#storeTranslations`,
`spell-checker.ts#correct`, and `engine/configuration.ts#paths` if the
underscore comes off). That ratio is worth reporting back to the RFC — it is
much higher than the 6% global residue estimate, and it is the number
`naming-gate-flip` needs.

### How to converge

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `c`, the TS name is `c`. No behavior changes and no public
surface changes.

A row that turns out to be an a1 or a3 finding is **not** renamed away: file it
against the RFC owning that file and leave the row standing.

The counts above are a snapshot; re-measure before claiming.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by **at least 3 of these 10 rows**, and no new
      `shape` rows.
- [ ] The remaining ~6 rows are each classified in the PR body as chained-call /
      nested-call residue with the Ruby `file:line`, in the form
      `naming-gate-flip` can lift straight into a baseline reason.
- [ ] The `trailties/rack/logger.ts#call` `env`-vs-`request` question is
      answered in the PR body: converged, or filed as a story against the RFC
      owning that file.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] `pnpm lint` passes and the i18n, trailties, did-you-mean and globalid
      tests pass; no public API change.
