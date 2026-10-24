---
title: "Vendor raabro, chronic, et-orbi and fugit and register them for parity"
status: draft
updated: 2026-10-24
rfc: "0000-fugit-gem-family-port"
cluster: fugit-family
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

None of the four gems is in `vendor/sources.ts` on `main`. The spike branch cloned them by hand: `floraison/raabro` `v1.4.0`, `floraison/et-orbi` `v1.2.11`, `floraison/fugit` `v1.11.1` and `mojombo/chronic` `v0.10.2`. The first three versions are the ones `vendor/rails/v8.0.2/Gemfile.lock:202,234-236,431` resolves, and solid_queue 1.1.3 asks for `fugit ~> 1.11.0` (`vendor/solid_queue/v1.1.3/solid_queue.gemspec:32`). chronic is not in the lockfile. fugit (`lib/fugit/nat.rb`) and et-orbi call it when `defined?(::Chronic)`, and their specs load it.

Every package story enrolls its gem in the parity gates, and those registrations sit in shared files (`vendor/sources.ts`, `vendor/sources.lock.json`, the api-compare / test-compare package lists). Landing them once, first, keeps the four package PRs from conflicting there.

## Acceptance criteria

- [ ] The four gems are entries in `vendor/sources.ts` at the refs above, with `libPath` and test paths following `vendor/README.md`. `pnpm vendor:fetch` populates them and `sources.lock.json` is updated.
- [ ] `pnpm parity:api` / `pnpm parity:test` list the four packages (unported, at 0%) without erroring when `packages/<pkg>` does not exist yet, or registration waits for each package story; the PR says which.
- [ ] CI is green and the PR is merged.
