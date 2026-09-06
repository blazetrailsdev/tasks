---
title: "Gate signed-id verifier on nil secret (not falsy) and raise ArgumentError"
status: closed
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered on trails origin/main: packages/activerecord/src/signed-id.ts:6 now imports ArgumentError from @blazetrails/ruby-compat and :30 guards `if (secret == null)` (empty string reaches MessageVerifier), matching signed_id.rb:87. Both source ACs met; the remaining test-assertion AC is covered by signed-id-nil-secret-tests-assert-argumenterror-class."
---

## Context

`ClassMethods.signedIdVerifier` in `packages/activerecord/src/signed-id.ts`
gates on `if (!resolvedSecret)`, so an empty-string secret (or a lambda
returning `""`) raises "You must set ActiveRecord::Base.signed_id_verifier_secret
to use signed ids".

Rails checks `if secret.nil?`
(`vendor/rails/activerecord/lib/active_record/signed_id.rb:87`) — an empty
string is a legitimate (if weak) secret and builds a `MessageVerifier`.
`MessageVerifier.new` does its own argument checking.

Rails also raises `ArgumentError`; trails raises a bare `Error`, so
`assert_raises(ArgumentError)` in
`vendor/rails/activerecord/test/cases/signed_id_test.rb:163,174` has no real
counterpart in our port (the ported tests only assert "throws").

Surfaced while reviewing PR #5907 (converge-signed-id-verifier-secret-writer);
pre-existing, not introduced there.

## Acceptance criteria

- The nil check matches Rails: only a nullish secret raises; `""` reaches
  `MessageVerifier`.
- The raised error is the trails analogue of Ruby's `ArgumentError`, and the
  ported nil-secret tests assert that type rather than any throw.
- Test names unchanged.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
