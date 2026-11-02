---
title: "mail-message-yaml"
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

Peeled from trails#9626. message.rb:1823-1863 (to_yaml, from_yaml) and lib/mail/yaml.rb are unported.

## Acceptance criteria

- Mail::YAML, Message#toYaml and Message.fromYaml ported; yaml_spec.rb and the PartsList YAML round-trip spec pass.
