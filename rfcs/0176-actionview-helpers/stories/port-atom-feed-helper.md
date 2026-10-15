---
title: "AtomFeedHelper: port (or record a true non-port) + atom_feed_helper_test"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
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

`AtomFeedHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/atom_feed_helper.rb`: `atom_feed`, `AtomBuilder`, `AtomFeedBuilder#updated/#entry`, `xhtml_block?`) is 0/5 and `atom_feed_helper_test.rb` is unported. It drives `Builder::XmlMarkup`; the `builder` handler is a recorded non-port in the register.

## Acceptance criteria

- [ ] Decide and record: port it against a minimal in-tree XmlMarkup (ruby-compat or actionview) or register it with a reason true of the tree. Default is to port.
- [ ] If ported: `helpers/atom-feed-helper.ts` live Module + `atom_feed_helper_test.rb`; parity row 0 missing.
