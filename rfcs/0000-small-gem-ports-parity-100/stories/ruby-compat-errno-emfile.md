---
title: "ruby-compat defines Errno::EMFILE for Rack::Multipart::MultipartPartLimitError"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-api
packages: [ruby-compat, rack]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Multipart::MultipartPartLimitError < Errno::EMFILE`
(`vendor/rack/v3.1.14/lib/rack/multipart/parser.rb:10`). The TS class extends
`Error`, which `parity:api` reports as an inheritance `super-mismatch`.
`packages/ruby-compat/src/errno.ts` defines `ENOTTY`, `EEXIST` and `ENOENT` as
`SystemCallError` subclasses from `set_syserr`
(`vendor/ruby/v3.3.11/error.c:2700-2737`), but has no `EMFILE` (checked
2026-10-15).

## Acceptance criteria

- [ ] `Errno.EMFILE` is defined beside `EEXIST` / `ENOENT` in the same shape,
      with its `Errno` constant, and carries the same `@noRailsEquivalent PERMANENT`
      receipt they carry.
- [ ] `ruby-compat`'s extra-surface mark is not raised (a receipted member is
      mark-neutral).
