---
title: "rack: the 15 middleware spec files' assertion tail takes Rails' bodies"
status: in-progress
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-tests
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9237
claim: "2026-10-22T18:07:55Z"
assignee: "rack-middleware-spec-tail-takes-rails-bodies"
blocked-by: null
closed-reason: null
---

## Context

The three `rack-tests` stories are all done, and
`rack-deflater-files-static-builder-specs-take-rails-bodies` (still draft) owns
`spec_deflater.rb`, `spec_files.rb`, `spec_static.rb` and `spec_builder.rb`,
while `rack-spec-lint-takes-rails-bodies` owns `spec_lint.rb`. Between them
they cover 96 of rack's 132 assertion-count and 120 of its 185 assertion-kind
mismatches. **The remaining tail — 15 middleware spec files — is owned by no
story**, so the RFC's Verification clause ("0 assertion-count, assertion-kind
and assertion-value mismatches and 0 TS-only extras in Rails-named files")
cannot be met by the open set.

Measured on trails `main` @ `ee595ccb75` with a full `pnpm build`, then
`pnpm parity:test --package rack --assertions`. rack is otherwise at
`572/592 methods` (the gap is `lint.rb` alone), `0` call rows, `0` arg `shape`
rows, extra-surface **rowless**, `0` unpinned bodies and `866/872` tests.

Residue this story owns, excluding the five files above:

| Ruby spec                 |  count |   kind | value | TS-only |
| ------------------------- | -----: | -----: | ----: | ------: |
| `spec_show_exceptions.rb` |      9 |      9 |     0 |       0 |
| `spec_auth_basic.rb`      |      6 |      6 |     0 |       0 |
| `spec_sendfile.rb`        |      3 |     11 |     1 |       0 |
| `spec_urlmap.rb`          |      4 |      6 |     1 |       0 |
| `spec_show_status.rb`     |      4 |      6 |     1 |       0 |
| `spec_cascade.rb`         |      3 |      6 |     0 |       0 |
| `spec_conditional_get.rb` |      0 |      6 |     0 |       0 |
| `spec_method_override.rb` |      2 |      2 |     2 |       1 |
| `spec_events.rb`          |      2 |      2 |     0 |       0 |
| `spec_recursive.rb`       |      1 |      3 |     0 |       0 |
| `spec_lock.rb`            |      0 |      3 |     0 |       0 |
| `spec_head.rb`            |      1 |      2 |     0 |       0 |
| `spec_null_logger.rb`     |      1 |      1 |     0 |       0 |
| `spec_etag.rb`            |      0 |      1 |     0 |       0 |
| `spec_common_logger.rb`   |      0 |      1 |     0 |       0 |
| `spec_utils.rb`           |      0 |      0 |     1 |       3 |
| `spec_multipart.rb`       |      0 |      0 |     0 |       0 |
| **total**                 | **36** | **65** | **6** |   **4** |

Six further TS-only extras sit in `media-type.test.ts` (2), `version.test.ts`
(2), `mock-request.test.ts` (1) and `query-parser.test.ts` (1), for **10** in
Rails-named files once `spec_lint.rb`'s 9 and the draft story's 4 are
subtracted from the reported 23.

`spec_common_logger.rb`'s single kind row is the residual the parent story
recorded: `(0..1).must_include duration` (Range include) against trails'
truthy `Range#isInclude`. `spec_multipart.rb`'s 5 skips all carry
`PERMANENT-SKIP:` lines citing CLAUDE.md § "A String has no encoding tag
either" and stay.

Rails spec bodies are at `vendor/rack/v3.1.14/test/spec_<name>.rb`; the
`test/cgi` DOCROOT fixtures the middleware specs share already live at
`packages/rack/test/cgi/`.

## Acceptance criteria

- [ ] Each of the 17 files above takes the Rails spec bodies verbatim — same
      apps, same fixtures, same assertion kinds and literal values — with the
      test names unchanged (CLAUDE.md "NEVER rename or reword test names").
- [ ] `pnpm parity:test --package rack --assertions` reports 0 count, 0 kind
      and 0 value mismatches for every file in the table.
- [ ] The 10 TS-only tests in Rails-named files move to `*.trails.test.ts` or
      are deleted; none remains in a Rails-named file.
- [ ] A divergence that is a comparer mapping gap rather than a port gap files
      a script story under this RFC (per § Design) instead of being left as a
      row.
- [ ] If the work exceeds the PR LOC ceiling, ship it in the table's order —
      `show_exceptions`, `auth_basic`, `sendfile`, `urlmap`, `show_status`,
      `cascade`, `conditional_get` first — and file the remainder as one
      sibling story, not several.
