---
title: "Audit converted fetch ternaries for keywords forwarded as undefined"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9346 converted about 40 two-argument, literal-key `fetch(h, "k", d)` calls on plain objects to `Object.hasOwn(h, "k") ? h.k : d`. That is the CLAUDE.md "Hash calls on a plain object" row, and the form Ruby's `Hash#fetch` (`vendor/ruby/v3.3.11/hash.c` `rb_hash_fetch_m`) mirrors. ruby-compat's `fetch` goes through `hasKey` (`packages/ruby-compat/src/hash.ts`), which reads a plain object's `{ k: undefined }` as an absent key. CLAUDE.md's kwargs bullet uses that shape for a caller forwarding an absent keyword. So where a caller forwards an absent keyword as `undefined`, a converted site now answers `undefined` where it answered the default. The same difference made trails#9346 revert its `hasKey` conversions in `mysql2/client.ts` and `checkConstraintExists`, which red-tested `Mysql2::Client#initialize` and `checkConstraintExists derives the name…`.

Converted sites that may receive forwarded keywords:

- thor `actions.ts` (`inside`, `run`), `actions/file-manipulation.ts`, `shell/basic.ts`, `parser/option.ts` (`repeatable`): Rails/thor `config.fetch(:verbose, true)` and similar.
- actionview `helpers/form-helper.ts`, `form-options-helper.ts`, `tags/select-renderer.ts`, `tags/weekday-select.ts`: Rails `options.fetch(:include_hidden, true)` and similar (`actionview/lib/action_view/helpers/tags/*.rb`).
- `rack/src/mock-response.ts`, `rack-session/src/cookie.ts`, `activejob/src/test-helper.ts`, `activesupport/src/values/time-zone.ts`, `i18n/src/backend/simple.ts`, `actioncable/src/connection/internal-channel.ts`, `abstract-adapter.ts` `advisoryLocks`.

## Acceptance criteria

- [ ] For each site, trace whether any caller can pass `{ k: undefined }`, which is a TS default-parameter or kwarg forward of an absent value.
- [ ] Where it can, the caller stops forwarding an absent keyword as an own `undefined` property, which converges on Ruby's absent key. Or, if the caller is outside the port, the site keeps the helper with the absent-keyword disable from the table row.
- [ ] A regression test per fixed site passes `{ k: undefined }` and fails on the current base.
