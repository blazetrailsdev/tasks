---
title: "IntegerOutOf64BitRange raises an invented message, not Rails'"
status: draft
updated: 2026-08-29
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `param-drift-activerecord-concrete-adapters` (PR #7191), which
converged `IntegerOutOf64BitRange#initialize` onto Rails' `msg` parameter but
deliberately kept the existing message text so the PR carried no behaviour
change. The text itself is still ours, not Rails'.

Rails builds the message in `check_int_in_range` and raises with it
(`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:78-93`):

```ruby
def check_int_in_range(value)
  if value.to_int > 9223372036854775807 || value.to_int < -9223372036854775808
    exception = <<~ERROR
      Provided value outside of the range of a signed 64bit integer.

      PostgreSQL will treat the column type in question as a numeric.
      This may result in a slow sequential scan due to a comparison
      being performed between an integer or bigint value and a numeric value.

      To allow for this potentially unwanted behavior, set
      ActiveRecord.raise_int_wider_than_64bit to false.
    ERROR
    raise IntegerOutOf64BitRange.new exception
  end
end
```

`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`
(`checkIntegerRange`) instead raises with an invented one-liner:

```ts
const exception =
  `${value} is out of range for PostgreSQL bigint (64-bit signed integer): ` +
  `-9223372036854775808 to 9223372036854775807`;
```

Same error class and raise site, different string — so a Rails dev reading the
thrown message does not recognise it, and the guidance it carries (the numeric
sequential-scan consequence, and the `raise_int_wider_than_64bit` escape hatch)
is missing.

Note the surrounding shape while converging: our `checkIntegerRange` has an
extra `!Number.isSafeInteger(value)` arm that Rails has no counterpart for. It
is load-bearing — `BigInt()` throws `RangeError` on a non-integer double, so
the arm must run before the `BigInt` conversion — but whether it belongs, and
whether it should raise this same error, is part of this convergence.

## Acceptance criteria

- `IntegerOutOf64BitRange` is raised with Rails' message verbatim, built at the
  raise site as `check_int_in_range` builds it (`quoting.rb:78-93`).
- The `raise_int_wider_than_64bit` sentence names the trails spelling of that
  setting if one exists; if it does not, say so in the story rather than
  inventing a name.
- The `!Number.isSafeInteger` arm is either justified at the call site as a
  language shortcoming with its Rails cite, or removed.
- `parity:api:calls` and `parity:api:calls:args` no new row; no test renamed.
