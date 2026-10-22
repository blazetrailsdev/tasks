---
title: "StringIO read/write raise IOError after close_read/close_write"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
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

trails#9242 added `StringIO#closeRead` / `#closeWrite` / `#isClosed` (`packages/ruby-compat/src/string-io.ts`). They track `_readable` / `_writable` the way `strio_close_read` / `strio_close_write` clear `STRIO_READABLE` / `STRIO_WRITABLE` (`vendor/ruby/v3.3.11/ext/stringio/stringio.c:520,541`). Nothing reads those flags yet. MRI's `readable(self)` / `writable(self)` guards (`stringio.c`, the `IOError "not opened for reading"` / `"not opened for writing"` raises) gate `read`, `gets`, `each`, `readpartial`, `write`, `<<`, `puts` and `print`. Today a closed `StringIO` keeps reading and writing.

## Acceptance criteria

- [ ] `read`/`gets`/`each`/`readpartial` raise `IOError("not opened for reading")` once `_readable` is false, through a private `readable()` mirroring MRI's.
- [ ] `write`/`append`/`puts`/`print` raise `IOError("not opened for writing")` once `_writable` is false, through a private `writable()`.
- [ ] Each is covered by a test in `string-io.trails.test.ts`.
