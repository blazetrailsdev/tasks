---
title: "Bump rails-html-sanitizer from v1.6.2 to v1.7.2, the floor actionview 8.0.5.2's gemspec requires"
status: draft
updated: 2026-11-10
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: post-flip
packages: ["scripts", "html-sanitizer", "actionview"]
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

RFC 0191 § 1 "Dependent sources" and "Order". `actionview.gemspec` at
`v8.0.5.2` adds `s.add_dependency "rails-html-sanitizer", "~> 1.6", ">= 1.7.2"`
(GHSA-2p2f-4rq4-gjwc): with the HTML5 sanitizer, older nokogiri left `<` and
`>` unescaped in attribute values, which `highlight` and `simple_format`
(`actionview/lib/action_view/helpers/text_helper.rb`) then turned into live
markup. trails pins `rails-html-sanitizer` at `v1.6.2` (`vendor/sources.ts`,
`libPath: "lib/rails/html"`, `compareTests: true`), ported as
`packages/html-sanitizer/lib/` (`sanitizer.ts`, `rails-html-sanitizer.ts`).
Upstream `v1.6.2...v1.7.2` is 57 commits: `lib/` 3 files +14/-21, tests 4
files +177 (GitHub compare, 2026-11-10).

This is the one dependent source the 8.0.5.2 flip forces. The burn-down
stories for `sanitize_helper.rb` and `text_helper.rb` depend on this one
(`generate-the-rails-8-0-5-1-burn-down-stories`), since their new tests assume
1.7.2's output.

## Acceptance criteria

- [ ] The tag `v1.7.2` and its `^{}` commit SHA are recorded.
- [ ] The pin floor is retaken on `v1.6.2` first.
- [ ] `pnpm parity:bump:dry-run --source rails-html-sanitizer --ref v1.7.2`
      is run and its report committed, and the bump lands in one PR: `ref`,
      `pnpm vendor:fetch --source rails-html-sanitizer`, `pnpm vendor:recite`,
      the three changed `lib/` bodies re-verified and re-pinned, and the
      upstream tests that trails' sanitizer tests mirror ported.
- [ ] The PR body confirms, with the actionview `sanitize_helper` and
      `text_helper` tests run locally, that nothing on the 8.0.2-verified
      actionview side regresses.
- [ ] Every gate is green; `parity:api` / `parity:test` deltas are in the PR
      body.

## Definition of done

Not closed by a wider baseline or a re-pin without re-verification.
