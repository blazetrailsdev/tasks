---
title: "api-compare-orphan-buckets-activesupport-core-ext-tail"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6167
claim: "2026-08-07T02:28:27Z"
assignee: "api-compare-orphan-buckets-activesupport-core-ext-tail"
blocked-by: null
closed-reason: null
---

## Context

Follow-up slice of `api-compare-orphan-reopened-file-buckets`. After that PR
(non-activesupport orphans) and the date/time calculations cluster
(`api-compare-orphan-buckets-activesupport-calculations`), ~60 activesupport
`core_ext/*` orphan files remain, each a reopening whose methods bucket under the
file that first defined the class. The largest are `core_ext/hash/keys.rb` (15),
`core_ext/date_time/conversions.rb` (13), `core_ext/numeric/time.rb` (13),
`core_ext/object/to_query.rb` (9), `core_ext/date/conversions.rb` (7),
`core_ext/module/attr_internal.rb` (7), `core_ext/string/filters.rb` (7),
`core_ext/time/zones.rb` (7); the tail is 1–6 methods each.

Enumerate them with the orphan query in the parent story.

Also unresolved: the `version.rb` one-method orphans in activerecord,
activemodel, activesupport, actionview and actionpackversion (`Module.version`).
Each package carries its version in package.json, so the natural resolution is an
`UNPORTED_FILES` entry — but note `isSourceUnported` matches by SUBSTRING, and
`"version.rb"` is a substring of `"gem_version.rb"`, which IS a real entity home
(`ActionPack.gem_version` / `.version`). A naive `pattern: "version.rb"` entry
silently drops that bucket; the exclusion needs a match that cannot overreach.

## Acceptance criteria

- Each remaining orphan file either gets a `RUBY_FILE_TS_OVERRIDES` entry naming
  its TS counterpart, or is documented as genuinely unported.
- The `version.rb` orphans are resolved without collaterally excluding
  `gem_version.rb`.
- Per-package ported-method deltas are reported in the PR body as measurement
  fixes.
- Split under the 500 LOC ceiling; register further slices as their own stories.
