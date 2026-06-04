---
title: "ar generate: reject illegal migration/model names"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 10
priority: 19
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2717). `generate:migration` and
`generate:model` do not reject names with characters outside `[a-zA-Z0-9_]`.
Rails' `validate_file_name!` raises on illegal names; names with hyphens/leading
digits produce uncompilable output here with no guard.

## Acceptance criteria

- [ ] `generate:migration` / `generate:model` reject names outside
      `[a-zA-Z0-9_]` (and leading digits) with a clear error, mirroring Rails'
      `validate_file_name!`.
- [ ] Field/model names that would emit uncompilable TS are rejected, not
      silently written.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
