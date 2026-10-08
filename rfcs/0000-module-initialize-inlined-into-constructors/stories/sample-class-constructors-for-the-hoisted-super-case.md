---
title: "audit: sample class constructors whose Rails initialize works on self before super"
status: draft
updated: 2026-10-08
rfc: "0000-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps: ["claude-md-section-for-inlined-module-initialize"]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This RFC rule 1 sanctions hoisting `super()` to the first line when the parent's body does not read what the child set up before Ruby's `super`. 885 Rails classes in `rails-api.json` define `initialize`; how many do work on `self` before `super`, and how trails spells each today, is not known.

## Acceptance criteria

- A script or one-off query lists Rails `initialize` bodies with a statement on `self` before `super`, per package, with the count.
- A sample of at least 30 across packages is checked by hand: hoisted and independent, hoisted but the parent reads the state (a bug), or inlined.
- Each bug found is filed as its own story with the Rails `file:line`.
- The result says whether a full sweep is warranted, and files it if so.
