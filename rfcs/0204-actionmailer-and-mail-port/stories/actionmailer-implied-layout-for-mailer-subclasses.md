---
title: "Mailer subclasses render in their implied layout (Layouts#inherited)"
status: in-progress
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9744
claim: "2026-11-05T16:06:39Z"
assignee: "move-db-commands-onto-databases-rake-tasks-part-2"
blocked-by: null
closed-reason: null
---

## Context

trails#9734 includes `ActionView::Layouts` in `ActionMailer::Base`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:496`). A layout
named with `layout` applies, but a mailer subclass never gets its implied
layout (`layouts/<mailer-name>`): Rails writes `_layout` per subclass in
`ActionView::Layouts::ClassMethods#inherited`
(`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:218-221`), and
trails has no `inherited` hook. Controllers reach it through
`fireInherited` in `packages/actionpack/src/action-controller/metal.ts:335`,
tracked by `layouts-inherited-writes-layout-method-at-first-construction`;
`packages/actionmailer/src/base.ts` has no counterpart.

## Acceptance criteria

- A mailer subclass with `layouts/<mailer-name>.<format>.tse` and no `layout`
  call renders inside it, converged on the same own-property memo shape
  (CLAUDE.md § "`inherited` is deferred to own-property memo guards") that
  the controller story lands, not a second stand-in.
- Port `base_test.rb`'s implied-layout assertion once `actionmailer-base-test-port` lands.
