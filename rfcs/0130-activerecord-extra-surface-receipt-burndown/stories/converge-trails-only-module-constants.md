---
title: "converge-trails-only-module-constants"
status: draft
updated: 2026-08-31
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

Surfaced by `extra-surface-scan-ts-file-constants` (RFC 0126), which taught
`collectTsFileNames` (`scripts/api-compare/extra-surface.ts`) to score
module-level `export const` names. Two activerecord files carry trails-only
constants that were invisible to the audit until then:

- `packages/activerecord/src/roles.ts:1-2` — `WRITING_ROLE = "writing"` and
  `READING_ROLE = "reading"`. Rails has no such constants: `active_record.rb:268-269`
  sets `self.writing_role = :writing` / `self.reading_role = :reading` as
  configuration, and every reader goes through that config
  (`connection_handling.rb`), never through a constant. trails reads the
  constants directly at `core.ts:397` and `connection-handling.ts:185,244`.
- `packages/activerecord/src/encryption/test-keys.ts:1-3` — `TEST_PRIMARY_KEY`,
  `TEST_DETERMINISTIC_KEY`, `TEST_KEY_DERIVATION_SALT`. The three literals are
  Rails', but they live in `activerecord/test/cases/helper.rb:98-102` as inline
  config assignments in the TEST harness, not as `lib/` surface.

Both files carry a file-level `@noRailsEquivalent CONVERGEABLE` receipt naming
this story, which is what keeps the RFC 0117 extra-surface mark unraised while
the convergence is scheduled.

## Acceptance criteria

- `roles.ts` is gone (or holds no exported constant): the role default reads
  off the ActiveRecord config seat the way `connection_handling.rb` does.
- The encryption test keys move to the test harness that mirrors
  `activerecord/test/cases/helper.rb`, out of `src/`.
- Both file-level `@noRailsEquivalent` receipts are deleted, and
  `pnpm parity:api:extra:tighten` writes the activerecord mark DOWN.
