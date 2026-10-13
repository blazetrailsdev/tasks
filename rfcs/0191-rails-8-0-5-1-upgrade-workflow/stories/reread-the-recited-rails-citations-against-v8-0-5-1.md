---
title: "Re-read every recited Rails citation against the v8.0.5.1 tree"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: [scripts, activesupport, activejob, arel]
deps: [flip-the-rails-ref-to-v8-0-5-1]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

vendor/README.md § "Upgrading a source", step 6: `vendor:recite` rewrites only
the version segment, and a green citation gate is not evidence the citation
still points at the same code. 103 `vendor/rails/v8.0.2/…` citations sat in 47
files on 2026-10-13: 20 under `scripts/`, 7 in ruby-compat, 6 under `docs/`,
3 each under `vendor/` and `eslint/`, CLAUDE.md, README.md and a handful of
package files. 189 Ruby files under the ported paths changed in this bump.

## Acceptance criteria

- [ ] For each file in the pre-rewrite `vendor:recite --check` list, every
      citation's file exists in `vendor/rails/v8.0.5.1/` and its line or range
      holds the code the surrounding text describes. A moved range is
      corrected; a citation whose code is gone is rewritten or removed with
      the prose that depended on it.
- [ ] `pnpm parity:api:inlined` is green; a stale `@inlinedFrom` span is
      fixed with `pnpm parity:api:inlined:fix`.
- [ ] CLAUDE.md's worked examples that quote Rails line ranges are checked
      the same way.
- [ ] The PR body lists each corrected citation as old range → new range.

## Definition of done

Unversioned `activerecord/lib/…:123` citations in package JSDoc are not in
scope: each is refreshed by the burn-down story that re-verifies its file.
