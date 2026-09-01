---
title: "The err.name = \"...\" sites throw the real class instead of relabelling an Error"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The convergence PR #7340 named these out of its own scope, and RFC 0129's
`converge-argument-error-remaining-packages` explicitly deferred them: sites
that do not declare a class at all, but mutate a plain `Error`'s `name` after
the fact so it *reads* as a Ruby core class. They are invisible to
`grep -rn "class ArgumentError"`, which is why the class-convergence stories
left them behind. Verified 2026-09-01:

- `packages/activerecord/src/relation/query-methods.ts:860` —
  `err.name = "ArgumentError"`
- `packages/activemodel/src/attribute-set.ts:109` and `:179` —
  `err.name = "FrozenError"`
- `packages/activerecord/src/migration/compatibility.ts:60` —
  `err.name = "MigrationError"`

The first three now have a real class to throw:
`ArgumentError` and `FrozenError` both live at
`packages/ruby-compat/src/argument-error.ts` / `frozen-error.ts` as of
#7340, each with a `vendor/ruby/error.c:LINE` citation (3323 and 3366). The
fourth is different in kind — `ActiveRecord::MigrationError` is a class Rails
DOES define (`vendor/rails/activerecord/lib/active_record/migration.rb:118`,
`class MigrationError < ActiveRecordError`) and trails already has it in
`packages/activerecord/src/migration.ts` — so that one converges onto the
existing trails class, not onto ruby-compat.

Why this matters beyond tidiness: a renamed `Error` is not an instance of the
class it claims to be, so `catch (e) { if (e instanceof ArgumentError) }`
never fires for it, and `rails-error-parity` matches on the name rather than
the identity. Rails' `raise ArgumentError, "..."` produces a real
`ArgumentError`; these sites produce an `Error` wearing its label.

Read each raise site's Rails counterpart before converting — the point is to
throw the class Rails throws at the line Rails throws it, not to mechanically
swap the constructor.

## Acceptance criteria

- `grep -rn 'name = "' packages/*/src --include=*.ts | grep -v '\.test\.'`
  reports no site that renames a plain `Error` into a class trails already
  declares.
- Each converted site throws the real class — ruby-compat's `ArgumentError` /
  `FrozenError`, or activerecord's own `MigrationError` — and cites the Rails
  `file.rb:LINE` it mirrors at the call site or in the PR body.
- Any site that genuinely cannot throw the real class (a rethrow that must
  preserve an existing error's identity and stack) keeps the assignment and
  says so with the Rails line, rather than being converted blindly.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:api:extra:gate` needs no mark
  raise.
