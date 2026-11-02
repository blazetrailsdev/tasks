---
title: "mail-content-field-specs-port"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
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

Peeled from trails#9626. Content-Type, Content-Disposition, Content-ID fields and ParameterHash are in packages/mail/src/fields/ with no specs of their own.

## Acceptance criteria

- content_type_field_spec.rb, content_disposition_field_spec.rb, content_id_field_spec.rb and parameter_hash_spec.rb ported and passing.
