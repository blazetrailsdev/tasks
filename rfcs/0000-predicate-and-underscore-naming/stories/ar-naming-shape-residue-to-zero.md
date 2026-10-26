---
title: "Take ActiveRecord's remaining naming-shape debt to zero"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps:
  [
    "ar-invented-underscore-relation-sync-twins",
    "ar-invented-underscore-adapter-driver-plumbing",
    "ar-invented-underscore-base-and-schema-helpers",
    "extra-surface-underscore-candidate-private-only",
  ]
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

The three `ar-invented-underscore-*` stories name the sites the audit could attribute. This story owns everything `pnpm parity:api:naming-shape --list activerecord` still reports in the `invented`, `private-helper` and `jsProtocol` dimensions after they land. That includes:

- the audit's 79 invented public sites the slices did not name;
- any of the 34 `@internal` names that re-measure as `invented` (see the RFC's "Changes to existing gates");
- `js-protocol` rows such as a static `call`. `then` is exempt.

Names owned by `table-name-and-primary-key-are-declared-through-underscore-statics` (RFC 0189) are out of scope.

## Acceptance criteria

- [ ] Measure first. If `--list activerecord` for the three dimensions shows more rows than fit in about 200 LOC, ship a slice and file the rest as stories cut from the listing.
- [ ] Every remaining row is converged onto its Rails name, made TS-private, or receipted (`@internal` + `@noRailsEquivalent`; a JS-protocol member cites its CLAUDE.md section).
- [ ] AR `invented`, `private-helper` and `jsProtocol` counts are 0.
