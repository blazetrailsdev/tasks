---
title: "call-gate-credits-include-on-hash-literal-ivar"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9787
claim: "2026-11-06T15:17:08Z"
assignee: "call-gate-credits-include-on-hash-literal-ivar"
blocked-by: null
closed-reason: null
---

## Context

`Mail::Encodings.defined?` is `@transfer_encodings.include? get_name(name)` (`vendor/mail/2.8.1/lib/mail/encodings.rb:29-31`). `@transfer_encodings` is assigned `{}` at `encodings.rb:13`, so it is a Hash. The trails port at `packages/mail/src/encodings.ts` `isDefined` uses the native form, `Object.hasOwn(transferEncodings, Encodings.getName(name))`. The call gate still reports `include?` as missing. `scripts/api-compare/enumerable-idioms.ts` (RFC 0190 Hash rows, ~:336-339) credits `include?` / `member?` only where every Ruby site's receiver is a proven `hash`, and an ivar that is assigned a Hash literal is not proven.

## Acceptance criteria

- The Ruby extractor proves an ivar a `hash` when its only assignments in the file are Hash literals (or the gate otherwise credits `Object.hasOwn` on that ivar's TS name), so `Encodings.defined?` credits `include?`.
- The `@missingRailsCall include?` receipt on `isDefined` is deleted.
