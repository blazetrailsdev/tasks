---
title: "Port mini_mime with its vendored type DB"
status: draft
updated: 2026-10-22
rfc: "0000-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mini-mime"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mini_mime` 1.1.5 answers `lookup_by_filename`, `lookup_by_extension` and
`lookup_by_content_type` over two flat files (`lib/db/ext_mime.db`,
`content_type_mime.db`) with a binary search and an LRU cache. `mail` calls it
from `attachments_list.rb` and `part.rb`.

## Acceptance criteria

- `packages/mini-mime` ports `MiniMime`, `Info` and `Db` at their Ruby names, reading
  the vendored DB files.
- The gem's tests pass; `parity:api` and `parity:test` enrol the package.
