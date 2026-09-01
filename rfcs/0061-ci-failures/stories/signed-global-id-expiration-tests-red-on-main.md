---
title: "SignedGlobalID expiration tests are red on main"
status: draft
updated: 2026-08-30
rfc: "0061-ci-failures"
cluster: null
packages: []
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

Five `SignedGlobalIDExpirationTest` cases fail on `origin/main`:

- `passing expires_in less than a second is not expired`
- `favor expires_at over expires_in`
- (plus three more in the same describe)

Verified pre-existing and unrelated to PR #7208: with that branch's changes
fully removed (`git checkout origin/main -- <every changed path>`) the failures
still reproduce, so they are on main itself.

Representative failure, `packages/globalid/src/signed-global-id.test.ts:159`:

```text
AssertionError: expected null not to be null
  const sgid = SignedGlobalID.create(person(5), { verifier, expiresIn: ... });
  vi.setSystemTime(new Date("2024-01-01T00:00:00.500Z"));
  expect(SignedGlobalID.parse(sgid.toString(), { verifier })).not.toBeNull();
```

i.e. a sgid that should still be live at +500ms parses as expired.

Prime suspect is #7218, "give the clock sub-millisecond resolution, as Ruby's
`Time.now` has" — these are the only sub-second expiry assertions in the suite,
and they compare a faked system time against a generated `expires_at`. A
sub-millisecond `now` that rounds or truncates differently on either the create
or the parse side would flip exactly this boundary.

Rails' reference behaviour: `globalid/lib/global_id/signed_global_id.rb` —
`expires_at` is stamped at create and compared with `Time.now.utc` in
`verify_expiration`, so a value strictly in the future must verify.

## Acceptance criteria

- [ ] The five `SignedGlobalIDExpirationTest` cases pass on all lanes.
- [ ] The root cause is identified in the clock/expiry comparison rather than
      papered over by loosening the assertions or the fixture times — the test
      names and their Rails counterparts stay verbatim.
- [ ] If #7218's resolution change is the cause, the fix keeps the
      sub-millisecond resolution (that is the Rails-faithful part) and corrects
      the comparison instead.
