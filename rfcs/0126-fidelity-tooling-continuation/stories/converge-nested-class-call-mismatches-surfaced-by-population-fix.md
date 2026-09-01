---
title: "converge-nested-class-call-mismatches-surfaced-by-population-fix"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`compare.ts` used to drop a Ruby class nested inside a same-file parent from
`allRuby` entirely, so the class's methods never entered the coverage
denominator. The story
`compare-drops-nested-class-methods-from-coverage-denominator` fixed that:
`collectRubyEntities` now keeps every class, and the headline moved from
13312/15477 (86%) to 13534/15946 (84.9%) as 469 previously-invisible Ruby
methods joined the population.

Making those bodies visible also surfaced 23 pre-existing call-set
divergences that had never been measured. They were baselined in
`call-mismatches-exclude/` in that PR rather than converged, because they are
spread across six packages and unrelated to the tooling change. Each row's
`reason` names the nested class and cites this story.

The rows, by package:

- activerecord — `associations/preloader/association.ts` (`LoaderQuery`,
  `LoaderRecords`), `insert-all.ts` (`Builder`)
- activesupport — `inflector/inflections.ts` (`Uncountables`)
- actiondispatch — `http/request.ts` (`PassNotFound`),
  `journey/path/pattern.ts` (`AnchoredRegexp`, `MatchData`),
  `journey/visitors.ts` (`Parameter`), `middleware/flash.ts` (`FlashHash`),
  `middleware/host-authorization.ts` (`Permissions`,
  `DefaultResponseApp`), `middleware/remote-ip.ts` (`GetIp`),
  `middleware/server-timing.ts` (`Subscriber`)
- actionview — `renderer/streaming-template-renderer.ts` (`StreamingBody`)
- rack — `directory.ts` (`DirectoryBody`)

One confirmed example: `LoaderQuery#load_records_for_keys`
(`activerecord/lib/active_record/associations/preloader/association.rb:41-57`)
ends `.load(&block)`; trails' `loadRecordsForKeys` assigns
`rel._instantiateBlock` and calls `rel.toArray()` instead.

## Acceptance criteria

- Converge the bodies so they make the calls Rails makes, and delete the
  corresponding rows from `call-mismatches-exclude/`. The baseline is
  only-shrink — do not reseed.
- Split by package if one PR would exceed the LOC ceiling; file the
  remainder as sibling stories rather than stacking.
- `pnpm parity:api:calls` green with the rows removed, and
  `pnpm parity:api:calls:tighten` run for any mark left stale.
