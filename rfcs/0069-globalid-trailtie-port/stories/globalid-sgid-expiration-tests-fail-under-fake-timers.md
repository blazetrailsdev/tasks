---
title: "globalid: five SignedGlobalIDExpirationTest cases fail — fake timers do not move Temporal.Now"
status: claimed
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-08-31T15:51:54Z"
assignee: "activesupport-railtie-initializer-yields-no-app"
blocked-by: null
closed-reason: null
---

## Context

Five cases in `packages/globalid/src/signed-global-id.test.ts`
(`SignedGlobalIDExpirationTest`: `passing expires_in less than a second is not
expired`, `favor expires_at over expires_in`, `expires_in defaults to class
level expiration`, `passing in expires_in overrides class level expiration`,
`passing expires_at overrides class level expires_in`) fail locally with
`expected null not to be null`. Verified pre-existing at PR #7297's merge base
by restoring the file from HEAD and re-running, so they predate that PR.

The cases wrap `vi.useFakeTimers()` / `vi.setSystemTime(...)` around
`SignedGlobalID.create` + `parse`. Expiry is computed through
`Temporal.Now.instant()` (`packages/globalid/src/signed-global-id.ts`,
`pickExpiration` and `verifyWithVerifierValidatedMetadata`), and vitest's fake
timers patch `Date`, not `Temporal.Now` — so the SGID is minted against the
real clock while the assertions reason about the faked one, and every token
reads as expired.

Rails' `signed_global_id_test.rb` drives the same cases through
`travel_to` (`vendor/globalid/test/cases/signed_global_id_test.rb`), which
moves the one clock `Time.now` reads.

## Acceptance criteria

- [ ] The five cases pass without renaming them (test names are the parity key).
- [ ] The fix moves the clock these bodies actually read — a `Temporal.Now`
      seam honored by the fake timers, or the activesupport `travelTo`
      analogue — rather than rewriting the assertions around real time.
- [ ] Confirm whether CI was green on these (a different vitest project/setup
      may install a Temporal shim); if so, record which setup file does it.
