---
title: "trailmap: /packages/:name says a trails-only package has no Rails counterpart instead of showing empty tiles"
status: done
updated: 2026-11-08
rfc: "0136-trailmap"
cluster: null
packages:
  ["activerecord-cli", "ruby-compat", "trails-tsc", "tse-compiler", "vitest-matchers", "website"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#127
claim: "2026-11-07T04:46:56Z"
assignee: "api-compare-gem-ports-without-api-rows"
blocked-by: null
closed-reason: null
---

## Context

`activerecord-cli`, `ruby-compat`, `trails-tsc`, `tse-compiler`, `vitest-matchers` and `website` have no Rails counterpart by design. Their `/packages/<name>` pages render empty API, test and file sections that look the same as missing data. A reader cannot tell "not applicable" from "the sync is broken", and the actionpack gap went unnoticed for that reason.

## Acceptance criteria

- When `rails_counterpart` is NULL, the overview and files pages say "trails-only: no Rails counterpart" in place of the empty API, test and file sections, in both apps. Test match is still shown where test:compare has rows (`ruby-compat`).
- A test on each side covers a package with a NULL counterpart.
- The `/packages` index marks those packages the same way.
