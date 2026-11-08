---
title: "Classes loaded by plain require register with DescendantsTracker"
status: draft
updated: 2026-11-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Class#subclasses` records every class as it is defined, through
`inherited`. trails registers a subclass with `DescendantsTracker` only from
Zeitwerk's `on_load` (`_registerAutoloaded`,
`packages/trailties/src/application/finisher.ts`). trails#9855 widened that from
ActiveRecord `Base` to every loaded class. A class loaded any other way is
never registered:

- a file Zeitwerk shadows (two `notifier_preview` files on two `preview_paths`),
  loaded through the undecorated `require`;
- a `require`d non-autoloaded file.

In both cases `Preview.all` (`actionmailer/lib/action_mailer/preview.rb`, via
`descendants`) misses the class. This blocks "mailer previews are loaded from
custom preview_paths" (`railties/test/application/mailer_previews_test.rb:104`)
in `trailties-mailer-previews-test-port-remaining`.

## Acceptance criteria

- A class seated by `rbFLoad` (`packages/ruby-compat/lib/load.ts`) that a
  `DescendantsTracker` class tracks is registered under its superclass, as
  `Class#subclasses` would see it.
- The custom `preview_paths` mailer-previews test passes once ported.
