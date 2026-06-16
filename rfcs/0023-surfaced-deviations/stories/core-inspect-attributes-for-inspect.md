---
title: "Core#inspect honors attributes_for_inspect"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during RFC 0030 story `collection-proxy-inspect` (PR #3437). Rails
`ActiveRecord::Core#inspect` renders only `attributes_for_inspect`
(`inspect_with_attributes(attributes_for_inspect)`), which defaults to `:all`
but is overridable per-model (e.g. `AuditLog.attributes_for_inspect = [:id,
:message]`). Our `inspect` (packages/activerecord/src/core.ts:74) instead
iterates the full `_attributes` map and ignores the model's
`attributesForInspect`.

`inspectWithAttributes` + `attributesForInspect` already exist in core.ts
(lines 644-666); `Core#inspect` simply does not route through them. The
collection-proxy-inspect test passed only because `message` is present in the
full attribute set regardless.

Rails ref: `activerecord/lib/active_record/core.rb` (`#inspect` →
`inspect_with_attributes(attributes_for_inspect)`); model
`activerecord/test/models/audit_log.rb` (`attributes_for_inspect`).

## Acceptance criteria

- [ ] `Core#inspect` routes through `attributesForInspect` /
      `inspectWithAttributes`, honoring a per-model `attributesForInspect`.
- [ ] Default (`"all"` / unset) preserves current full-attribute output.
- [ ] Add/port the Rails test covering a model with a restricted
      `attributes_for_inspect`.
