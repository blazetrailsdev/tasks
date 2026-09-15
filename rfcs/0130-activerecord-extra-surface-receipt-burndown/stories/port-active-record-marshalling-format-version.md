---
title: "port-active-record-marshalling-format-version"
status: in-progress
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7782
claim: "2026-09-15T13:15:36Z"
assignee: "converge-actionpack-ipaddr-onto-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord.marshalling_format_version` / `=` (`vendor/rails/activerecord/lib/active_record.rb:463-469`) delegate to `ActiveRecord::Marshalling.format_version` (`activerecord/lib/active_record/marshalling.rb`). trails has no `marshalling.ts`, so `active_record.rb` scores 14/16 in parity:api (trails#7759).

## Acceptance criteria

- Port `marshalling.rb` (`format_version`, `format_version=`, `Methods#_marshal_dump_7_1` / `marshal_load`) as `packages/activerecord/src/marshalling.ts`.
- Add `marshallingFormatVersion` / `setMarshallingFormatVersion` to `active-record.ts`, bringing `active_record.rb` to 16/16.
