---
title: "applicationRecordClassQ ported in inheritance.ts, Rails puts it in core.rb"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5564 (RFC 0081, `convert-ar-config-accessors-internal-flags`).
Converting `applicationRecordClass` to an accessor made it a ported method, so
the wide calls ratchet checked `core.ts` for the read Rails does in
`application_record_class?` and flagged it as missing.

Rails defines `application_record_class?` in
`vendor/rails/activerecord/lib/active_record/core.rb` (module
`ActiveRecord::Core::ClassMethods`). Trails ports it as
`applicationRecordClassQ` in
`packages/activerecord/src/inheritance.ts:719-724`, where it _does_ read
`ActiveRecord.applicationRecordClass` correctly. The behavior is right; only
the file placement diverges, and api-compare scores per file, so `core.ts`
reads as omitting a call it never had.

This is the pattern CLAUDE.md calls out: a method must stay in the file that
matches Rails' layout or api:compare cannot credit it there. The entry is
baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/core.json`
with that reason.

## Acceptance criteria

- `applicationRecordClassQ` lives in `core.ts` (Rails' layout), with callers
  in `inheritance.ts` updated, OR a recorded justification for why it must sit
  in `inheritance.ts`.
- If moved: the `core.ts` / `application_record_class?` entry is removed from
  `call-mismatches-wide-exclude/activerecord/core.json`.
- `pnpm api:compare` matched count does not drop.
