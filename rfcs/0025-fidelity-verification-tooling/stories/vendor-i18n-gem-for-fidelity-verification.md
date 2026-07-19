---
title: "Vendor the i18n gem so ActiveSupport/ActiveModel i18n ports can be verified against source"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

The i18n gem is NOT vendored: `vendor/` holds only rails, rack, globalid,
did_you_mean. Rails depends on i18n 1.14.7 (`vendor/rails/Gemfile.lock:287`),
and several ActiveSupport/ActiveModel surfaces are ports of i18n gem code, not
Rails code — `packages/activesupport/src/i18n.ts` and
`packages/activemodel/src/i18n.ts` both port `I18n::Backend::Base#translate`
/ `#default` / `#resolve` and `I18n::MissingTranslation::Base#message`.

During PR #4969 this cost five review rounds. Every predicate edge
(`default: []`, a bare unresolved Symbol default, `default: [null]`,
`default: nil` presence-vs-value) had to be inferred from Ruby semantics or
from indirect coverage in `vendor/rails/actionview/test/template/translation_helper_test.rb`,
because neither the agent nor the reviewer could read
`i18n/lib/i18n/backend/base.rb` or `i18n/lib/i18n/exceptions.rb`. Two of those
rounds landed fixes that a direct read would have caught immediately.

The vendoring machinery already exists and is gem-agnostic —
`vendor/sources.ts` + `vendor/sources.lock.json` + `pnpm vendor:fetch` — so
this is adding a source entry, not building infrastructure.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains an i18n gem entry pinned to the version in
      `vendor/rails/Gemfile.lock` (1.14.7 at time of writing).
- [ ] `pnpm vendor:fetch` populates `vendor/i18n/`; `sources.lock.json` updated.
- [ ] `scripts/start-worktree.sh` populates it in new worktrees like the
      other vendored sources.
- [ ] Line references to `i18n/lib/i18n/**` in `packages/activesupport/src/i18n.ts`
      and `packages/activemodel/src/i18n.ts` comments are verified against the
      vendored source and corrected where wrong (they were transcribed from
      review comments, never read).
- [ ] Consider whether `pnpm rails:find` should search the vendored gem too.
