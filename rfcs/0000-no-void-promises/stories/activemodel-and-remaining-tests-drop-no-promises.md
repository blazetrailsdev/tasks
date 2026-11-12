---
title: "ActiveModel and every other package's tests drop no promises"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: tests
packages:
  [
    activemodel,
    actionpack,
    ruby-compat,
    date,
    trailties,
    activesupport,
    rack,
    rackup,
    actionview,
    actionmailer,
    mail,
    actioncable,
    activejob,
    net-smtp,
    solid-queue,
    thor,
    zeitwerk,
  ]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Open questions. Test sites outside activerecord: activemodel 41
(`attribute-assignment*.test.ts`, `attribute*.test.ts`, `callbacks.test.ts`),
actionpack 13, ruby-compat 13, date 8, trailties 7, activesupport 5, rack 5,
rackup 5, actionview 4, and 1–2 each in actionmailer, mail, actioncable,
activejob, net-smtp, solid-queue, thor and zeitwerk.

## Acceptance criteria

- [ ] Every non-activerecord package's `floating` and `swallowed` test counts reach 0.
- [ ] No test changes what it asserts; a promise that now rejects is a real failure, fixed or filed.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
