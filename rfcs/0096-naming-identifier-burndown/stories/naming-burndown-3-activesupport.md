---
title: "Burn down the remaining 26 naming call-argument rows in activesupport (inflections, cache entry, callbacks, number helpers)"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 104
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
0096's scope. This slot is all remaining activesupport rows: **26 rows across 13
files**.

Note for the claimer: wave-2's `naming-burndown-2-activesupport` (#6433, merged
as 8880a583c) listed the same `inflector/inflections.ts` (7) and
`cache/entry.ts` (5) counts and they did **not** move. That is not a stale
snapshot — those twelve rows are structural, not renames (see below). Read that
analysis before claiming, and do not re-attempt a plain rename on them.

| Rows | File                                                                         |
| ---: | ---------------------------------------------------------------------------- |
|    7 | `packages/activesupport/src/inflector/inflections.ts`                        |
|    5 | `packages/activesupport/src/cache/entry.ts`                                  |
|    2 | `packages/activesupport/src/cache/file-store.ts`                             |
|    2 | `packages/activesupport/src/callbacks.ts`                                    |
|    2 | `packages/activesupport/src/message-pack/extensions.ts`                      |
|    1 | `packages/activesupport/src/cache/memory-store.ts`                           |
|    1 | `packages/activesupport/src/string-inquirer.ts`                              |
|    1 | `packages/activesupport/src/messages/metadata.ts`                            |
|    1 | `packages/activesupport/src/notifications/fanout.ts`                         |
|    1 | `packages/activesupport/src/number-helper/number-to-currency-converter.ts`   |
|    1 | `packages/activesupport/src/number-helper/number-to-percentage-converter.ts` |
|    1 | `packages/activesupport/src/number-helper/number-to-phone-converter.ts`      |
|    1 | `packages/activesupport/src/values/time-zone.ts`                             |

### Representative rows, with both sides

- **`callbacks.ts#append` / `#prepend`** — TS parameter is `callback`, passed to
  `appendOne` / `prependOne`. Rails
  (`vendor/rails/activesupport/lib/active_support/callbacks.rb`, `CallbackChain#append`)
  names it `c`: `callbacks.each { |c| append_one(c) }`. Two plain renames; the
  Rails single letter wins.
- **`number-helper/number-to-currency-converter.ts#convert`** — TS passes
  `(abs, opts)`; Rails
  (`activesupport/lib/active_support/number_helper/number_to_currency_converter.rb`)
  passes `(number.abs, options)` — the recorded Ruby args are `numberD` and
  `options`. `opts`→`options` is a plain rename; the `abs` half is a
  chained-call recording.
- **`number-helper/number-to-percentage-converter.ts#convert`** — TS
  `roundedOptions`, Rails `options`. Plain rename.
- **`message-pack/extensions.ts#writeObject`** — TS `klass`, Rails `class`
  (`write_class(class, packer)`). Per `docs/ruby-ts-conventions.md`, Ruby
  `class` as an identifier is `klass` in trails, so this pair is a _convention_
  recording, not a divergence — baseline it at the gate flip.
- **`values/time-zone.ts#rfc3339`** — TS `instantFrom`, Rails `utc`.
- **`cache/file-store.ts#normalizeKey`** — TS `normalizedKey`, Rails `key`
  (`cache/file_store.rb#normalize_key`, `Digest::MD5.hexdigest(key)`). This is
  the same file the RFC's Motivation section calls out for
  `deleteEntry(dirname(filePath))` vs `File.dirname(key)`; check whether the
  extra local is masking that a3 before renaming.

### Structural rows — do not attempt a rename

- **`inflector/inflections.ts` (7 rows)** —
  `packages/activesupport/src/inflector/inflections.ts:41,44,50,53,58,59` call
  `this.uncountables.delete(rule.toLowerCase())`. Rails
  (`activesupport/lib/active_support/inflector/inflections.rb:152-153`) is
  `@uncountables.delete(rule)` — the downcasing lives _inside_
  `Uncountables#delete`. The trails call sites do the conversion at the call
  site instead, which is why the recorded arg is `ref:toLowerCase`. This is an
  a3 (conversion moved to the call site), and the convergence is to push the
  `toLowerCase` into `Uncountables#delete`/`#add` — a real body change, in
  scope for this story if it fits, otherwise filed.
- **`cache/entry.ts` (5 rows)** —
  `packages/activesupport/src/cache/entry.ts:35,49,84,94` read `this._value`
  where Rails reads `@value`. The leading underscore is a trails field-naming
  choice, not a local rename. Either drop the underscore (checking nothing
  outside the class reads it) or classify as convention residue for
  `naming-gate-flip`.

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
      the `naming` class down by **at least 9 of these 26 rows** from the plain
      renames alone, and by up to 21 if the `inflections.ts` a3 and the
      `cache/entry.ts` underscore are also converged. No new `shape` rows.
- [ ] The `inflections.ts` and `cache/entry.ts` blocks are each either converged
      or filed as a follow-up story with the Rails `file:line`, and named in the
      PR body — they are explicitly not to be left as an unexplained no-op a
      second time.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] `pnpm lint` passes and the activesupport tests pass; no public API change.
