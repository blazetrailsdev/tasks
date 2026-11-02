---
title: "mail-parts-list-delegate-class"
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

Peeled from trails#9626. parts_list.rb:5 is DelegateClass(Array); packages/mail/src/parts-list.ts extends Array because ruby-compat DelegateClass(Array) forwards no length, index read or iteration.

## Acceptance criteria

- DelegateClass forwards those for an Array; PartsList converges on it with @parts held separately.
