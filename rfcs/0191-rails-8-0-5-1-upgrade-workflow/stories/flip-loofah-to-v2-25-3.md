---
title: "Flip loofah to v2.25.3 and converge html5/scrub.rb"
status: done
updated: 2026-11-26
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-nokogiri-to-v1-19-7
deps-rfc: []
est-loc: null
priority: null
pr: trails#10813
claim: "2026-11-26T18:22:28Z"
assignee: "burn-down-stories-file-cleanly"
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1. `bump-loofah-to-v2-25-3` retook loofah's pin floor on `v2.24.0`
(21 pairs) and committed the dry run
`scripts/parity/bump-ledger/reports/loofah-v2.24.0-v2.25.3.2026-11-23.json`.
Tag `v2.25.3` is `b05513b1286525f22db90ee4f4baa26274110649`, and its `^{}` is
`bbe007e52e8aeaa520b3e515235d467f5b1416e6`.

The dry run found 5 drift rows, all in `html5/scrub.rb`: `cdata_escape`,
`scrub_attribute_that_allows_local_ref`, `scrub_attributes`, `scrub_css` and
`scrub_uri_attribute`. It found 0 stale rows and 0 new gate rows. The lib diff
`v2.24.0...v2.25.3` touches `html5/scrub.rb` (+239), `scrubbers.rb`,
`html5/safelist.rb`, `loofah.rb` and `version.rb`. Methods go from 23/77 to
23/83, so 6 are new upstream. Tests go from 185 to 274: 102 added, 13 removed.

loofah 2.25.3 requires nokogiri `>= 1.19.5`, so this story needs
`flip-nokogiri-to-v1-19-7` first.

## Acceptance criteria

- [ ] The floor commit has merged (it has, with this story's parent PR).
- [ ] The `ref` is `v2.25.3`. Run `pnpm vendor:fetch --source loofah`,
      `pnpm vendor:mirrors` and `pnpm vendor:recite`, with the recite in its
      own commit.
- [ ] The 5 drifted bodies in `packages/html-sanitizer/lib/loofah/html5/scrub.ts`
      are re-verified and converged, and the 6 new methods are ported. Then
      run `body-pins.ts --pin loofah/html5/scrub.rb` (and for any other
      changed file). No ledger is needed if all of this fits in one PR.
      Otherwise seed one and file the follow-up stories.
- [ ] The new upstream tests that trails' loofah test files mirror are ported.
- [ ] Every gate is green, and the PR body carries the `parity:api` and
      `parity:test` deltas.
