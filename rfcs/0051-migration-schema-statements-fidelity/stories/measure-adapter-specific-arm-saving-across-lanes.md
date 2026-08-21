---
title: "Measure the #6121 adapter-specific-arm saving on all four lanes (AC4 of the snapshot story, shipped unverified)"
status: done
updated: 2026-08-18
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6705
claim: "2026-08-18T15:10:51Z"
assignee: "port-test-date-parse-formats-iso8601-tests"
blocked-by: null
closed-reason: null
---

## Context

`move-adapter-specific-snapshot-off-ar-internal-metadata` (PR #6324) fixed the
255-char defect — the adapter-specific snapshot is now chunked across
`adapter_specific_tables` (count) + `adapter_specific_tables_<n>` rows in
`packages/activerecord/src/support/canonical-schema-stamp.ts`, so the per-boot
memo can no longer switch itself off as the adapter-specific half grows.

Its fourth acceptance criterion was **not** met and was shipped as `[~]`:

> The measured per-file saving from #6121 still holds on all three lanes
> (sqlite ~0 ms for the arm, MariaDB ~2.5 min per run).

Two review rounds raised it and it is still open. What #6324 established, so the
next agent does not re-derive it:

- **Structural argument only.** #6324 does not touch the fast path —
  `test-setup-dy.ts`, `purgeToCanonicalTables`, `resetTestTables`,
  `loadAdapterSpecificSchema` and `recordBootLaidTables` are unmodified, and the
  value handed to `purgeToCanonicalTables(conn, laid)` as `alsoProtect` is
  identical to what the old encoding produced whenever it produced anything.
  That is an argument, not a measurement.
- **What IS pinned, on every lane:** the memo's _availability_. "boot must have
  recorded a snapshot" (`support/template-stamp.test.ts`, the
  "adapter-specific tables snapshot" describe) is unconditional and reds
  whenever `adapterSpecificTables` answers `null` — which is what baseline
  MySQL did once the half passed 255 chars.
- **What CANNOT be pinned this way, established by a reverted attempt.**
  Commit `3be2d49c7` added `BootOutcome.relaidAdapterSpecific` and asserted a
  fast-path boot skipped the adapter-specific arm; `ec1fdb6a9` reverted it.
  `intact` is false whenever a snapshot table is missing, and that happens on a
  **correct** boot: a worker recycled onto a slot database whose
  adapter-specific table an earlier occupant's test dropped takes the
  `fastPath` arm (the canonical half is still stamped) and legitimately re-lays
  the other half — the path `test-setup-dy.ts:62-65` documents
  `support/drop-all-tables.test.ts` as relying on. Scoping the assertion to
  "an intact snapshot skipped the re-lay" does not rescue it either:
  `relaidAdapterSpecific` is _defined_ as `!intact` on that arm, so the scoped
  assertion is a tautology over the bit it reads. **Do not re-attempt that
  shape.** An observation taken from inside the boot, computed from the same
  database state as the decision, cannot independently confirm the decision.

## Converged shape

No Rails counterpart — trails-only bootstrap plumbing (originally RFC 0028; the
backing table shape is Rails' at
`vendor/rails/activerecord/lib/active_record/internal_metadata.rb:84-98`, and
MySQL's `varchar(255)` rendering at
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:31-34`,
but the memo itself has nothing to converge toward).

The measurement has to come from **outside** a single boot. Sketch:

- Time the boot arm per worker across a whole run and aggregate, rather than
  asserting a per-boot bit — e.g. wall-clock around `loadAdapterSpecificSchema`
  in `test-setup-dy.ts`, summed per run and reported, so the number is an
  observation rather than a pass/fail on one worker.
- Compare a run with the memo forced off against a normal run, on each of the
  four lanes the criterion names: sqlite file, `sqlite3_mem`, PG, MariaDB.
  Forcing it off is a one-line local edit (make `adapterSpecificTables` answer
  `null`); it does not need a shipped flag.
- Report the four numbers. If the saving no longer holds on a lane, that is the
  finding and it wants its own story.

Whether anything is _shipped_ is open: the honest outcome may be a recorded
measurement in the RFC rather than new code. Prefer that over inventing a
gate that only re-reads its own input.

## Acceptance criteria

- [ ] A before/after measurement of the adapter-specific arm's cost exists for
      all four lanes: sqlite file, `sqlite3_mem`, PG, MariaDB.
- [ ] The #6121 claim (sqlite ~0 ms for the arm, MariaDB ~2.5 min per run) is
      either confirmed with those numbers or corrected with them.
- [ ] Any shipped observability does NOT re-derive its assertion from the same
      state the boot decided on — see the reverted `3be2d49c7` above.
- [ ] `move-adapter-specific-snapshot-off-ar-internal-metadata`'s AC4, shipped
      as `[~]`, is closed out by the result.

## Measurement (2026-08-18)

Method, per the "Converged shape" sketch — from **outside** a single boot, not
from a bit the boot computed for itself. `test-setup-dy.ts`'s fast-path arm was
temporarily wrapped in a `performance.now()` pair around
`if (!intact) await loadAdapterSpecificSchema(conn)` and the elapsed ms logged
per boot; the same 24 `packages/activerecord/src/*.test.ts` files were then run
twice per lane, once normally and once with the memo forced off by a one-line
`return null` at the top of `adapterSpecificTables`
(`support/canonical-schema-stamp.ts:103`). Both edits were reverted; nothing was
shipped. 24 files produced 24 fast-path boots on every lane that has one, so the
per-boot mean scales by the boot count of a full run (~782 AR files).

| lane          | memo on                            | memo off | saving per boot | extrapolated per run |
| ------------- | ---------------------------------- | -------- | --------------- | -------------------- |
| sqlite (file) | 0.0 ms                             | 20.5 ms  | 20.5 ms         | ~16 s                |
| `sqlite3_mem` | no boot takes the fast path at all | —        | n/a             | n/a                  |
| PostgreSQL 17 | 0.0 ms                             | 174.7 ms | 174.7 ms        | ~2.3 min             |
| MariaDB 11    | 0.0 ms                             | 57.0 ms  | 57.0 ms         | ~45 s                |

### What this says about the #6121 claim

- **"sqlite ~0 ms for the arm" is wrong, mildly.** The arm is ~20 ms per boot on
  the sqlite file lane, not ~0 — the memo saves ~16 s across a full run there.
  The claim reads as if there were nothing to save on sqlite; there is, it is
  just small next to the server lanes.
- **"~2.5 min per run" holds in order of magnitude, measured on PG rather than
  MariaDB:** 174.7 ms per boot, ~2.3 min extrapolated over a full run. The memo
  is doing what #6121 said it does on a server lane.
- **`sqlite3_mem` has no fast path to save on.** Each worker's `:memory:`
  database is fresh, so `canonicalSchemaUpToDate` is false on every boot and the
  full-load arm runs unconditionally. The memo is structurally inapplicable
  there — neither a saving nor a regression. This was not previously recorded
  and is the one genuinely new finding.

Nothing is shipped: no observability was added, so AC3 (do not re-derive the
assertion from the state the boot decided on) is satisfied vacuously, and the
reverted `3be2d49c7` shape was not re-attempted.

### MariaDB (2026-08-21, [[measure-adapter-specific-arm-saving-on-mariadb]])

Same method, on `mariadb:11` with a tmpfs data dir (the CI service container's
image and mount, `.github/workflows/ci.yml:1213-1222`), reached over TCP with
`ARCONN=mysql2`. The bounded set was 7 `packages/activerecord/src/*.test.ts`
files (`active-record-schema`, `aggregations`, `annotate`, `association-cache`,
`attributes`, `base`, `batches`), each producing one fast-path boot; both edits
were reverted and nothing shipped. Memo on: 0.0 ms on all 7 boots, twice.
Memo off: 47.8-69.6 ms, mean 57.0 ms.

**#6121's "MariaDB ~2.5 min per run" is corrected, not confirmed.** The arm
costs ~57 ms per boot on MariaDB, which extrapolates to ~45 s of cumulative
boot time over a full ~782-file run — about a third of what the claim states,
and about a third of the PG lane's 174.7 ms/boot. The memo is real and worth
keeping on this lane; the original figure was roughly 3x optimistic. With the
MariaDB lane sharded 2 ways in CI, the wall-clock effect per shard is ~23 s.

`move-adapter-specific-snapshot-off-ar-internal-metadata`'s AC4 is now closed by
all four lanes.
