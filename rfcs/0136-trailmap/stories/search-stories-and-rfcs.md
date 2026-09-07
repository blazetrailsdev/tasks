---
title: "Search stories and RFCs — surface ringo never had"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0136 phase D is surface ringo never had. The point is not features: it is
that parity work only exercises the framework where ringo already went, and the
proving-ground clause says a phase that surfaces nothing has probably been
built around the framework rather than on it.

Search is the cheapest honest test of that. There are ~6,600 stories across
~136 RFCs; nothing today can answer "which stories mention `serialize`". It
exercises query building, parameter handling, pagination and result rendering
in one route — none of which the show pages touched.

## Acceptance criteria

- A search route over story and RFC titles and bodies, with results ranked and
  bounded.
- The query is built through the framework's query surface, not string-
  concatenated SQL. If the surface cannot express it, that is a trails story —
  file it and cite it.
- Pagination, sharing its implementation with `paginate-the-backlog-list-page`
  rather than a second one.
- Framework gaps filed as trails stories; the PR body lists them.
