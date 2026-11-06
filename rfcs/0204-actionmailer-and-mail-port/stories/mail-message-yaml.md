---
title: "mail-message-yaml"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: [mail]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9774
claim: "2026-11-06T01:57:03Z"
assignee: "mail-header-field-specs-and-content-field-rows"
blocked-by: null
closed-reason: null
---

## Context

Peeled from trails#9626. message.rb:1823-1863 (to_yaml, from_yaml) and lib/mail/yaml.rb are unported.

## Acceptance criteria

- Mail::YAML, Message#toYaml and Message.fromYaml ported; yaml_spec.rb and the PartsList YAML round-trip spec pass.
