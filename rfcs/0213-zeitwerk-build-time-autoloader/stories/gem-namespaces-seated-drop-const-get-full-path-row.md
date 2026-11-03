---
title: "Seat Mail, Net and MiniMime so constGet drops its full-path row fallback"
status: closed
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-03T13:56:40Z"
assignee: "constant-residue-excluded-other-packages-receipts"
blocked-by: null
closed-reason: "FALSIFIED: the full-path fallback serves ~400 rows across most packages, not only Mail/Net/MiniMime; those three are seated in trails#9666 and the deletion moves to intermediate-namespaces-seated-drop-const-get-full-path-row"
---

## Context

trails#9654 made `constGet(Object, "A::B")` fall back to a full-path `generatedClass` row when the segment walk raises `NameError` (`packages/ruby-compat/src/variable.ts`, `constGet`). The rows that need the fallback are mail's `Mail::*`, net-smtp's `Net::SMTP*` and mini-mime's `MiniMime::*`: their parent namespaces `Mail`, `Net` and `MiniMime` have no seat on `TopLevel`. Ruby's `rb_path_to_class` (`vendor/ruby/v3.3.11/variable.c:432`) walks one segment at a time and has no full-path arm. Root CLAUDE.md § "Constant lookup is an import or a registry" calls full-path seats transitional.

## Acceptance criteria

- `Mail`, `Net` and `MiniMime` are seated on `TopLevel` by their defining gems (`TopLevel.Mail = Mail`), and each child row resolves by walking segment by segment.
- `constGet`'s full-path `generatedClass(cpath)` fallback is deleted, and `pnpm parity:class-paths --check` stays green.
