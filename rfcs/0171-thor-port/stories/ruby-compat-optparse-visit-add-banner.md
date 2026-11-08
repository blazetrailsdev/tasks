---
title: "ruby-compat-optparse-visit-add-banner"
status: draft
updated: 2026-11-08
rfc: "0171-thor-port"
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

MRI `OptionParser#banner` (`vendor/ruby/v3.3.11/lib/optparse.rb:1235-1241`) calls `visit(:add_banner, @banner)` on first read, letting `List#add_banner` (:961-964) / `Switch#add_banner` (:640) extend the default banner. ruby-compat's `banner` getter (`packages/ruby-compat/lib/optparse.ts`) omits it because the parser has no `visit` / `List` stack; it carries `@missingRailsCall visit`.

## Acceptance criteria

- Port `OptionParser#visit` and `add_banner` on List/Switch; call `visit("addBanner", this._banner)` in the getter; drop the receipt.
