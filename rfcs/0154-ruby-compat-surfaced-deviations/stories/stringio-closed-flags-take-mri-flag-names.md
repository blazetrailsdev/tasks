---
title: "StringIO closed-state fields take MRI's STRIO_READABLE/WRITABLE names"
status: draft
updated: 2026-11-14
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10075 made `StringIO`'s state JS-private: one `#ptr` for `struct StringIO`
(`vendor/ruby/v3.3.11/ext/stringio/stringio.c:36-43`) plus per-object `#_readable` /
`#_writable` (`packages/ruby-compat/lib/string-io.ts`). The flags got the `_` prefix
in an attempt to keep the `internal` count down, but the count counts every `#` member
whatever its name, so the operator raised the ruby-compat mark 805 -> 807 instead. The
prefix now does nothing.

MRI keeps these as bits in the object's own flags: `STRIO_READABLE` / `STRIO_WRITABLE`
(`stringio.c:133-135`), cleared by `strio_close_read` / `strio_close_write`
(`:520-528`, and the write version just after) and copied by `strio_copy` (`:633-634`).

## Acceptance criteria

- The two fields are spelled from the MRI flags (`#readable` / `#writable`, or one
  `#flags` word with `STRIO_READABLE` / `STRIO_WRITABLE` bits, as `stringio.c:133-135`
  has them), with no `_` prefix.
- `initializeCopy` keeps copying them per object (`strio_copy`, `stringio.c:633-634`).
- If one `#flags` word is used, `pnpm parity:api:extra:gate` stays green with the
  ruby-compat internal mark tightened to 806.
- Consider bundling with `stringio-read-write-check-closed-flags`, which reads the
  same flags.
