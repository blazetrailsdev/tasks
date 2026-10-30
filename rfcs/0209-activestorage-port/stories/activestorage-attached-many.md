---
title: "Port has_many_attached, Attached::Many and the many-attachment changes"
status: in-progress
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attached-model-and-one"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9501
claim: "2026-10-30T18:16:42Z"
assignee: "activestorage-attached-many"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/model.rb:210-260` (`has_many_attached`,
same shape as `has_one_attached`), `attached/many.rb` (79,
`delegate_missing_to :attachments` at `:27`, `attach(*attachables)` at `:51`),
and `changes/{create_many,create_one_of_many,delete_many,detach_many,purge_many}.rb`
(~140).

## Acceptance criteria

- `hasManyAttached` and `Many` are ported as the one-attachment story ports
  `One`; `attach` accepts the splat and the array form; the writer is an async
  `set<Name>` that awaits `CreateMany` / `CreateOneOfMany`'s unfurl, per the
  RFC's Decisions.
- `Many`'s `delegate_missing_to` is a Proxy row in CLAUDE.md's table.
