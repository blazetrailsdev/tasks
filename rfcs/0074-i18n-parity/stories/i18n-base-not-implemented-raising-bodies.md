---
title: "Give Base#store_translations and #available_locales the gem's raising bodies"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6044
claim: "2026-08-04T02:25:52Z"
assignee: "i18n-base-not-implemented-raising-bodies"
blocked-by: null
closed-reason: null
---

# Give `Base#store_translations` and `#available_locales` the gem's raising bodies

## Context

- `vendor/i18n/lib/i18n/backend/base.rb:24-26` and `:97-99` define
  `store_translations` and `available_locales` as concrete methods that
  `raise NotImplementedError`. `packages/i18n/src/backend/base.ts` spells both
  as TypeScript `abstract` members instead.
- PR #6031 converged the third one — `lookup` (`base.rb:116-118`) — because
  `I18n::Backend::Chain` includes `Base` without defining a lookup, so
  `abstract` would have forced a method Rails does not have. The file-private
  `NotImplementedError` class it added is already in place.
- `abstract` is not wrong for a backend that must implement both, but it is a
  different contract from the gem's: Ruby lets a partial backend exist and fail
  at call time, and any future backend that inherits one of these without
  defining it (the gem's `KeyValue` and `Chain` are the precedents) cannot be
  spelled at all while the member stays `abstract`.

## Acceptance criteria

- `store_translations` and `available_locales` in
  `packages/i18n/src/backend/base.ts` are concrete and throw the file's
  `NotImplementedError`, matching `base.rb:24-26` and `:97-99` and the shape
  `lookup` already has.
- `Simple`, `Chain` and `Fallbacks` keep their overrides; nothing else changes.
- `pnpm typecheck`, `pnpm vitest run packages/i18n` and `pnpm parity:api:extra
--package i18n` are unchanged.
