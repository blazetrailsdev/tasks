---
title: "Split time-ext.ts by receiver onto the Rails file layout"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: 6740
claim: "2026-08-19T13:36:07Z"
assignee: "converge-time-zone-match-and-dst-predicates"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts` is **964 lines** hosting members from
at least four different Rails files and three different receivers. Its own
`Mirrors:` lines say so:

| Rails file                       | receiver | example                                   |
| -------------------------------- | -------- | ----------------------------------------- |
| `core_ext/time/conversions.rb`   | `Time`   | `to_fs`, `to_formatted_s`, `DATE_FORMATS` |
| `core_ext/time/compatibility.rb` | `Time`   | `preserve_timezone`, `system_local_time?` |
| `core_ext/string/zones.rb`       | `String` | `in_time_zone`                            |
| `core_ext/date/conversions.rb`   | `Date`   | `readable_inspect`, `default_inspect`     |

The collapse has a measured cost. `pnpm parity:api` reports
`core_ext/date/conversions.rb`'s `readable_inspect` and `default_inspect` as
**missing** (2 of the 26-method AR-closure gap), because
`Time#readable_inspect` and `Date#readable_inspect` are two different Ruby
methods on two different receivers that can only occupy one TS name in a shared
file. Whichever one is written, the other reads as unported. The same is true
of `to_formatted_s`.

This is not a judgement call under CLAUDE.md: `parity:api` matches on the Rails
file layout, and the conventions table's `PATH_SEGMENT_ALIASES` /
`RUBY_FILE_TS_OVERRIDES` exist to express that layout, not to flatten it. A
file that hosts four Rails files cannot be paired member-for-member with any of
them.

The parent story recorded this as arm (B): _"needs the decision to split
time-ext.ts by receiver (the Rails layout parity:api matches on) first — that
move is the prerequisite, not the work."_ This story IS that move.

## Scope

Split `time-ext.ts` into files mirroring the Rails layout, one per Rails source
file, per `docs/ruby-ts-conventions.md`'s path rules. Re-export from the old
path only if something outside the package imports it — check first, and prefer
updating the importers to the Rails-shaped path.

This is a **move**, not a rewrite: bodies travel unchanged. The only new code is
the second `readable_inspect` / `default_inspect` / `to_formatted_s`, which
becomes writable once the receivers no longer share a file.

## Definition of done

Does not close by adding a `SKIP_GROUPS` entry for the collided names, and does
not close by renaming one of the pair — both receivers get their Rails-named
member at their Rails path.

## Acceptance criteria

- [ ] `time-ext.ts` no longer hosts members from more than one Rails source
      file; each new file's path is the one `conventions.ts` derives from its
      Ruby counterpart.
- [ ] `Date#readable_inspect` and `Date#default_inspect` exist alongside the
      `Time` ones and are credited — AR-closure rollup rises by 2 (baseline
      8917/8943, measured 2026-08-18).
- [ ] `to_formatted_s` exists for every receiver Rails defines it on.
- [ ] `pnpm lint --fix` run after a compare, so
      `blazetrails/rails-file-structure-method-order` orders the new files.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; no new baseline
      rows and no new SKIP_GROUPS entry.
