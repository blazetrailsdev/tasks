---
title: "Audit: ban Base.connection in the AR suite (helper.rb:27)"
status: draft
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/helper.rb:27` sets
`ActiveRecord.permanent_connection_checkout = :disallowed` suite-wide, with the
comment "ActiveRecord::Base.connection is only soft deprecated but we ban it
from the test suite to ensure it's not used internally."

trails has the flag — `packages/activerecord/src/ar-config.ts:126`,
`permanentConnectionCheckout: true | "deprecated" | "disallowed"` defaulting to
`true` — but no setup file sets it, so our suite does not ban `Base.connection`.
Found by the RFC 0064 spike (PR #5309,
`docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md`).

Blast radius: `grep -rl "Base\.connection\b" --include=*.test.ts` over
`packages/activerecord/src` = **114 files**. Not all are violations — the flag
governs _permanent checkout_ (`Base.connection`), not `lease_connection` /
`with_connection` — but the count is far too large for a blind flip, so this
story is an audit first, not a flip.

Related: [[project_with_connection_prevent_permanent_shim]] context — the
`with_connection` shim work interacts with this flag.

## Acceptance criteria

- Audit which of the 114 `Base.connection` test-file usages would actually raise
  under `permanentConnectionCheckout = "disallowed"`, distinguishing genuine
  permanent-checkout calls from ones already routed through `leaseConnection` /
  `withConnection`.
- Confirm trails' `disallowed` enforcement path actually raises where Rails'
  does (read `ar-config.ts` consumers + `connection-handling.ts`); if the
  enforcement is missing or partial, that is the finding.
- Deliver an audit report under `docs/infrastructure/` with a call-site
  inventory and a recommendation: either a bounded migration plan broken into
  follow-up stories, or a documented reason trails should not set `:disallowed`.
- Do NOT flip the flag in this story.
