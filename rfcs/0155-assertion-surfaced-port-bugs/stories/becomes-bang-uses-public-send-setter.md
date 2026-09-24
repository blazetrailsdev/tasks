---
title: "becomes! sets the STI column via public_send setter, not writeAttribute"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8045
claim: "2026-09-24T17:59:05Z"
assignee: "aes256-gcm-inspect-not-rails-format"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Persistence#becomes!` sets the STI column through the setter:
`became.public_send("#{klass.inheritance_column}=", sti_type)`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:514`). trails'
`becomesBang` (`packages/activerecord/src/persistence.ts`, ~:840) calls
`instance.writeAttribute(inheritanceCol, value)`, which skips an overridden
writer for the inheritance column. Surfaced by `output/setter-dispatch.json` (trails#7969).

## Acceptance criteria

- `becomesBang` assigns via the setter: `(instance as any)[inheritanceCol] = value`, the port of `public_send`.
- `becomes!` no longer appears in `output/setter-dispatch.json`.
- A test with an overridden inheritance-column writer confirms the writer runs.
