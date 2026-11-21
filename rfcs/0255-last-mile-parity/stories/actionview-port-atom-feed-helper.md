---
title: "actionview-port-atom-feed-helper"
status: claimed
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-21T21:31:42Z"
assignee: "action-pack-assertions-park-criterion-drops-builder-three"
blocked-by: null
closed-reason: null
---

## Context

`helpers/atom_feed_helper.rb` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/atom_feed_helper.rb:96-204`:
`atom_feed`, `AtomBuilder`, `AtomFeedBuilder`) has no trails port. Its unported-files row
(`scripts/parity/unported-files/actionview.ts`) used to rest on the `.builder` handler being
unported; that handler is ported (`packages/actionview/lib/template/handlers/builder.ts`) and
the actionpack builder template tests run since the bundle that unparked them.
`template/atom_feed_helper_test.rb` renders every case through a `.builder` template.

## Acceptance criteria

- [ ] `atomFeed`, `AtomBuilder` and `AtomFeedBuilder` are ported at their Rails names in `packages/actionview/lib/helpers/atom-feed-helper.ts`.
- [ ] The `atom_feed_helper.rb` unported-files row is deleted and `atom_feed_helper_test.rb` is ported with `.builder` fixtures.
