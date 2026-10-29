---
title: "Export String#tr and rb_str_cmp; converge Filename#sanitized and #<=>"
status: draft
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Filename#sanitized` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/filename.rb:59-62`) calls
`String#tr("\u{202E}%$|:;/<>?*\"\t\r\n\\", "-")`, and `#<=>` (`:72-74`) is `String#<=>`, which orders by bytes
(`vendor/ruby/v3.3.11/string.c` `rb_str_cmp`). trails#9461 wrote `sanitized` as a regex character-class replace
because ruby-compat exports no `tr`, and `compareTo` with JS `<` / `>`, which orders by UTF-16 code unit and differs from Ruby's order outside ASCII.
ruby-compat has `rbStrCmp` in `src/string/support.ts`, but it is not exported.

## Acceptance criteria

- ruby-compat exports `tr` (`rb_str_tr`) with an MRI citation, and `packages/activestorage/src/filename.ts` `sanitized` calls it.
- `rbStrCmp` is exported, and `Filename#compareTo` uses it so ordering matches Ruby's byte order.
