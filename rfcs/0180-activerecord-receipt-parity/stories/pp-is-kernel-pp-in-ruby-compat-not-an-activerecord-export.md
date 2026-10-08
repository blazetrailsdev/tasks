---
title: "ruby-compat: pp / PrettyPrint are Ruby stdlib; activerecord neither defines nor exports them"
status: done
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8684
claim: "2026-10-08T16:05:08Z"
assignee: "nodejs-inspect-custom-hooks-come-from-one-ruby-compat-seam"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Core#pretty_print(pp)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:798-818`) takes a `PP` instance from Ruby's stdlib
(`vendor/ruby/v3.3.11/lib/pp.rb:189` `pp`, `vendor/ruby/v3.3.11/lib/prettyprint.rb`) and calls
`object_address_group`, `seplist`, `breakable`, `group` and `text` on it. Rails defines none of
them.

trails defines the printer inside activerecord, in `packages/activerecord/src/pretty-print.ts`
(`pp`, `PrettyPrinter`, `PPSink` and the `Text` / `Breakable` / `Group` machinery), and re-exports
`pp` and the two types from `packages/activerecord/src/index.ts`. Both files carry a file-level
`@noRailsEquivalent … MOVED-BY-SHORT-NAME: pp.`, because the scorer matches the exported `pp` to an
unrelated `ConnectionAdapters::MySQL::ExplainPrettyPrinter#pp` by short name.

`pretty-print.ts`'s tag is audited by `activerecord-audit-permanent-receipts-root-n-z`; this story
owns the convergence for both.

## Converged shape

The printer is ruby-compat's port of `lib/prettyprint.rb` and `lib/pp.rb`, at its MRI names and
cited to `vendor/ruby/`, under the package's rule 1 (its call sites are `Core#prettyPrint`,
`Relation#prettyPrint` and `CollectionProxy`). `packages/activerecord/src/pretty-print.ts` is
deleted, `index.ts` exports no `pp`, and its file-level tag is deleted with it.

## Acceptance criteria

- [ ] ruby-compat exports `pp` and the `PrettyPrint` / `PP` surface activerecord calls, each receipted and listed in the package README.
- [ ] `packages/activerecord/src/pretty-print.ts` is deleted; `core.ts`, `relation.ts` and `associations/collection-proxy.ts` import the printer type from ruby-compat.
- [ ] `packages/activerecord/src/index.ts` carries no file-level `@noRailsEquivalent`.
- [ ] `pnpm parity:api:extra:gate` (activerecord rowless; ruby-compat receipted) and `pnpm parity:api:receipts:gate` stay green.
