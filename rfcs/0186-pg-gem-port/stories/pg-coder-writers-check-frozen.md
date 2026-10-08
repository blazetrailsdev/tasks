---
title: "pg: the coder writers raise FrozenError on a frozen coder"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: null
packages: []
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

trails PR 8690 ported the pg gem's coder writers into `packages/activerecord/src/pg/coder.ts`:
`Coder#flags=`, `CompositeCoder#elements_type=`, `#needs_quotation=` and `#delimiter=`. Each C writer
opens with `rb_check_frozen(self)` (`vendor/pg/v1.5.9/ext/pg_coder.c:342` `pg_coder_flags_set`, `:375`
area `pg_coder_needs_quotation_set`, `:405` `pg_coder_delimiter_set`, `:440`
`pg_coder_elements_type_set`), so assigning to a frozen coder raises `FrozenError`. The ports skip the
check and write. `Coder#name=` is `rb_define_attr` (`:591`), which raises on a frozen receiver too.

This is what is left of `pg-array-coders-port-the-gem-parser-flags-and-elements-type`, whose other
criteria PR 8690 met; that story is closed in favour of this one.

## Acceptance criteria

- [ ] Each of the five writers raises ruby-compat's `FrozenError` ("can't modify frozen
      PG::TextEncoder::Array: ...") when the coder is frozen, before any other check, as the C does.
- [ ] A `.trails.test.ts` case freezes a coder and asserts the raise for each writer.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/oid/array-encode.trails.test.ts
```
