---
title: "The ARTest config.rb skip hides four ported members behind a known bucketing bug"
status: draft
updated: 2026-08-18
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: ["activerecord"]
deps: ["api-compare-buckets-reopened-module-under-one-file"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `config.rb` entry in `SCOPED_SKIP_GROUPS` covers seven names and mixes two
populations, which its own reason separates:

> (1) `connection_name` / `test_configuration_hashes` / `connect`
> (connection.rb) and `expand_config` (config.rb) **ARE ported** — all four in
> packages/activerecord/src/support/connection.ts … They miss only because the
> bucket's expected TS file is config.ts.
>
> (2) `config` / `config_file` / `read_config` are the memoized read of
> test/config.yml; trails ships no config.yml …

Population (2) is a genuine absence and stays. Population (1) is four ported
members suppressed by a **file-bucketing artifact**: `module ARTest` opens in
`config.rb` and is reopened in `connection.rb`, so the Ruby extractor files one
ARTest entity under `config.rb` and every ARTest method buckets there.

Verified present in trails: `connectionName` (`support/connection.ts:71`),
`expandConfig` (`:251`), `testConfigurationHashes` (`:286`), and `connect`.

That bucketing bug already has a home — RFC 0025's
`api-compare-buckets-reopened-module-under-one-file`, currently `ready`. So
this skip is a second register for debt that is already tracked, and the four
names should re-enter the comparison when that bug is fixed rather than stay
suppressed in parallel.

The reason also records why the obvious workaround is closed: moving
`expandConfig` into `config.ts` would create an import cycle (it is typed on
`NamedConnection` / `ARUNIT_ENTRY_NAMES`, declared in `connection.ts`, which
already imports from `config.ts`). Do not attempt that move.

## Acceptance criteria

1. The `config.rb` entry is split: population (2) — `config`, `config_file`,
   `read_config` — keeps a scoped skip with the "no config.yml" reason;
   population (1) no longer relies on a skip.
2. The four ported members pair against `support/connection.ts` once the
   reopened-module bucketing fix lands, shown by a before/after `parity:api`
   run.
3. No member is moved between TS files to satisfy the comparator; in
   particular `expandConfig` stays in `connection.ts`.
4. The PR states the `parity:api` delta: denominator +4 and `matched` +4.
5. If the dependency has not landed, `block` this story against it rather than
   re-widening the skip.
