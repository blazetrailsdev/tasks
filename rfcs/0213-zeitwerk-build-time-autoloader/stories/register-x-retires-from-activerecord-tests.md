---
title: "activerecord tests seat with rbModConstSet"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["activerecord"]
deps: ["register-x-retires-from-source"]
deps-rfc: []
est-loc: 2200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

About 2,000 `registerModel(` sites. RFC 0213 § "`registerX` retires": `rbModConstSet(TopLevel, "Post", Post)` ports the `class` keyword's `rb_const_set`. Subject to RFC 0213 open question 4.

## Acceptance criteria

- Every activerecord test call is converted by one mechanical rename, noted in the PR body.
- No test name changes.
- `gate-rb-mod-const-set-to-rails-const-set-sites`' gate admits the shape.
