---
title: "Bump nokogiri from v1.18.3 to v1.19.7, the floor rails-html-sanitizer 1.7.2 forces"
status: draft
updated: 2026-11-10
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: ["scripts", "nokogiri"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources" and "Order". `actionview.gemspec` at
`v8.0.5.2` requires `rails-html-sanitizer ~> 1.6, >= 1.7.2`
(GHSA-2p2f-4rq4-gjwc), which requires loofah `>= 2.25.3`, which requires
nokogiri `>= 1.19.5`. Rails' `Gemfile.lock` at `v8.0.5.2` resolves nokogiri
1.19.7. trails pins `nokogiri` at `v1.18.3` (`vendor/sources.ts`, the
`nokogiri` entry; `compareTests: true`; ported as `packages/nokogiri/lib`).
Upstream `v1.18.3...v1.19.7` is 169 commits: `lib/` 29 files +353/-151, tests
39 files +3,430 (GitHub compare, 2026-11-10). racc, nokogiri's CSS-parser
runtime, moves 1.8.0 → 1.8.1 in the same lock and is a read-anchor beside it
(`vendor/sources.ts`, `racc` entry, which cites
`vendor/nokogiri/v1.18.3/lib/nokogiri/css/parser.rb:4`).

The procedure is vendor/README.md § "Upgrading a source (bumping `ref`)" with
RFC 0191's dry run and ledger, which are per source.

## Acceptance criteria

- [ ] `git ls-remote --tags https://github.com/sparklemotion/nokogiri.git
    'v1.19.7'` is recorded with its `^{}` commit SHA.
- [ ] The nokogiri pin floor is retaken on `v1.18.3` first
      (`pnpm parity:api:pins:all` scoped to nokogiri), in its own commit or PR.
- [ ] `pnpm parity:bump:dry-run --source nokogiri --ref v1.19.7` is run and
      its report committed. If the seed and its fixes fit one PR, this story
      is that PR: `ref`, `pnpm vendor:fetch --source nokogiri`,
      `pnpm vendor:recite`, re-verified and re-pinned bodies, all gates green.
      If not, the PR seeds `scripts/parity/bump-ledger/nokogiri.json` and the
      remainder is filed as stories in this RFC with `pnpm tasks new`.
- [ ] racc is moved to `v1.8.1` in the same PR if the dry run shows its
      anchor citations move; otherwise the PR body says why it stays.
- [ ] The `racc` entry's comment citation is rewritten by `vendor:recite`.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas for nokogiri are in the
      PR body.

## Definition of done

Not closed by a wider baseline or a re-pin of a drifted body without
re-verification.
