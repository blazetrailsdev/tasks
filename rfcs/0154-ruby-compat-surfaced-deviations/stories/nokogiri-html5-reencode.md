---
title: "Port Nokogiri HTML5 reencode for binary input"
status: draft
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["nokogiri"]
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

`Nokogiri::HTML5.read_and_encode` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5.rb:285-306`) was ported to `packages/nokogiri/lib/html5.ts` for its `read` and `to_s` arms only; its `reencode` of a non-UTF-8 body (charset sniffing, `html5.rb:309+`) is not, since a JS string carries no encoding tag (CLAUDE.md, "A String has no encoding tag either"). A `Uint8Array` input is the case that still needs it.

## Acceptance criteria

- `readAndEncode` handles a binary (`Uint8Array`) input by porting `reencode`'s BOM / meta-charset sniffing, with Nokogiri's tests for it ported.
