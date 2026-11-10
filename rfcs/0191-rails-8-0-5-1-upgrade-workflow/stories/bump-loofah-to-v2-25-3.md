---
title: "Bump loofah from v2.24.0 to v2.25.3, the floor rails-html-sanitizer 1.7.2 forces"
status: draft
updated: 2026-11-10
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: ["scripts", "html-sanitizer"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources". `rails-html-sanitizer` 1.7.2 requires
`loofah ~> 2.25, >= 2.25.3`; Rails' `Gemfile.lock` at `v8.0.5.2` resolves
loofah 2.25.3. trails pins `loofah` at `v2.24.0` (`vendor/sources.ts`,
`loofah` entry, `libPath: "lib/loofah"`, `compareTests: true`) and ports it
inside `packages/html-sanitizer/lib/loofah/`. Upstream `v2.24.0...v2.25.3` is
71 commits: `lib/` 5 files +225/-78, tests 8 files +856 (GitHub compare,
2026-11-10). loofah 2.25.3 requires nokogiri `>= 1.19.5`, hence the dep on
`bump-nokogiri-to-v1-19-7`.

## Acceptance criteria

- [ ] The tag `v2.25.3` and its `^{}` commit SHA are recorded.
- [ ] loofah's pin floor is retaken on `v2.24.0` first.
- [ ] `pnpm parity:bump:dry-run --source loofah --ref v2.25.3` is run and its
      report committed; the bump is one PR (`ref`,
      `pnpm vendor:fetch --source loofah`, `pnpm vendor:recite`, re-verified
      and re-pinned bodies in `packages/html-sanitizer/lib/loofah/`, the new
      upstream tests that trails' loofah test files mirror) or, if it does not
      fit, a seeded ledger plus stories filed in this RFC.
- [ ] Every gate is green; `parity:api` / `parity:test` deltas for loofah are
      in the PR body.

## Definition of done

Not closed by a wider baseline or a re-pin without re-verification.
