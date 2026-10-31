---
title: "rake-file-list-enumerator-returns"
status: draft
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/rake/src/file-list.ts` `ARRAY_CALLS.lazy` and `.chain` answer an Array, as do blockless iterators other than `each`, because ruby-compat ports no `Enumerator::Lazy` or `Enumerator::Chain`. Rake delegates these at `vendor/rake/v13.2.1/lib/rake/file_list.rb:44`; MRI defines them in `vendor/ruby/v3.3.11/enumerator.c`.

## Acceptance criteria

- [ ] ruby-compat ports `Enumerator::Lazy` and `Enumerator::Chain`, and `FileList#lazy`, `#chain` and blockless iterators answer an Enumerator.
- [ ] The `CONVERGEABLE` receipt on `ARRAY_CALLS` is removed.
