---
title: "mail-body-part-attachments-specs-remainder"
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

trails#9626 merged with body_spec.rb, parts_list_spec.rb and part_spec.rb partly ported and vendor/mail/2.8.1/spec/mail/attachments_list_spec.rb unported (fixtures in spec/fixtures/attachments). This code has barely been executed.

## Acceptance criteria

- All four specs ported with verbatim names and passing; bugs found fixed in packages/mail/src.
