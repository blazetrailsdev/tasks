---
title: "ruby-compat-optparse-initialize-banner-width-indent"
status: ready
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rackup::Server::Options#parse!` builds `OptionParser.new("", 24, '  ')` (`vendor/rackup/v2.2.1/lib/rackup/server.rb:25`), the banner, summary width and indent of `OptionParser#initialize` (`vendor/ruby/v3.3.11/lib/optparse.rb:1167`). ruby-compat's `OptionParser` (`packages/ruby-compat/src/optparse.ts`) has no constructor, so `packages/rackup/src/server.ts` `parseBang` carries `@missingRailsArgs new — CONVERGEABLE ruby-compat-optparse-initialize-banner-width-indent`.

## Acceptance criteria

- [ ] ruby-compat `OptionParser`'s constructor takes `banner`, `width = 32`, `indent = " ".repeat(4)` and `toString` lays out the summary with them.
- [ ] `parseBang` calls `new OptionParser("", 24, "  ")` and the receipt is gone.
