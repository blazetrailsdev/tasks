---
title: "mail-parts-list-delegate-class"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9764
claim: "2026-11-05T23:06:30Z"
assignee: "actionmailer-test-helper-remaining-tests"
blocked-by: null
closed-reason: null
---

## Context

Peeled from trails#9626. parts_list.rb:5 is DelegateClass(Array); packages/mail/src/parts-list.ts extends Array because ruby-compat DelegateClass(Array) forwards no length, index read or iteration.

## Acceptance criteria

- DelegateClass forwards those for an Array; PartsList converges on it with @parts held separately.
