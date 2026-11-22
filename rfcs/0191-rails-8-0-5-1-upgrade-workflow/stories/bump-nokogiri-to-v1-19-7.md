---
title: "Bump nokogiri from v1.18.3 to v1.19.7, the floor rails-html-sanitizer 1.7.2 forces"
status: in-progress
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: ["scripts", "nokogiri"]
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: 600
priority: null
pr: trails#10577
claim: "2026-11-22T15:44:07Z"
assignee: "bump-nokogiri-to-v1-19-7"
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
      its report committed under `scripts/parity/bump-ledger/reports/`.
- [ ] The flip (`ref`, `pnpm vendor:fetch --source nokogiri`,
      `pnpm vendor:recite`, the `nokogiri.json` ledger seed, re-verified and
      re-pinned bodies, racc `v1.8.1`, and the nokogiri `parity:api` /
      `parity:test` deltas) is filed as `flip-nokogiri-to-v1-19-7`, since the
      ledger gate recomputes the seed from the base branch's pins and so
      cannot pass in the PR that first lands them.

## Definition of done

Not closed by a wider baseline or a re-pin of a drifted body without
re-verification.
