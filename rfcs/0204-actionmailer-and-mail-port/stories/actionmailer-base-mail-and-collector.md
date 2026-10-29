---
title: "Port ActionMailer::Base#mail, part assembly and Collector"
status: ready
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer"]
deps: ["actionmailer-base-class-api"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`base.rb`'s instance side: `headers`, `attachments`, `mail`,
`apply_defaults`, `compute_default`, `assign_headers_to_message`,
`default_i18n_subject`, `collect_responses*`, `each_template`,
`wrap_inline_attachments`, `create_parts_from_responses`,
`insert_part`; and `collector.rb` (32).

## Acceptance criteria

- Ported at their Ruby names; the rest of `base_test.rb` passes.
