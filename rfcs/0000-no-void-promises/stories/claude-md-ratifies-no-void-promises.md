---
title: "trails CLAUDE.md ratifies no void promises and async initialize as static new"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps:
  [
    no-floating-promises-repo-wide-ignore-void-false,
    no-swallowed-rejection-lint-rule,
    constructor-creates-no-promise-lint-rule,
    ruby-compat-rb-class-new-instance,
    inlined-from-placement-accepts-static-new,
  ]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 5. Agents read rules from trails `CLAUDE.md`. Without a section
there, the shapes this RFC retires keep being copied.
`packages/activerecord/CLAUDE.md` § "A record is built with `new Klass` only"
(trails#8659) must point at the new section for the scope boundary, and
§ "A module's `initialize` is inlined into the constructor" must say where an
async segment goes.

It lands after the three gate stories and the two helper stories, so the section describes rules that are already enforced and tools that exist.

## Acceptance criteria

- [ ] A trails `CLAUDE.md` section states RFC § Design 1–2 as the rule: no void promises, no unawaited empty handlers, constructors create no promise, async `initialize` is `protected constructor` + `static async new` + `await Klass.new(...)`, background work is a `Thread`.
- [ ] The two existing sections cross-reference it; records stay `new Klass`.
