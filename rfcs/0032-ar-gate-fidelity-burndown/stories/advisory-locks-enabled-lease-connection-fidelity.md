---
title: "advisory-locks-enabled-lease-connection-fidelity"
status: ready
updated: 2026-06-21
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `adapter-advisory-locks-generic-construction` (RFC 0032, PR #3757).
That story converged the `AdvisoryLocksEnabledTest` "advisory locks enabled?"
test (`packages/activerecord/src/adapter.test.ts`) to a feature-only gate with
adapter-generic construction via a local `makeActiveAdapter` helper that builds
a fresh adapter from the env URL with the `advisoryLocks` option.

That is behaviorally faithful but mechanically simplified. The literal Rails
port (`vendor/rails/activerecord/test/cases/adapter_test.rb:982-1001`) leases
and re-establishes the _global_ connection:

```ruby
class AdvisoryLocksEnabledTest < ActiveRecord::TestCase
  include ConnectionHelper
  def test_advisory_locks_enabled?
    assert_predicate ActiveRecord::Base.lease_connection, :advisory_locks_enabled?
    run_without_connection do |orig_connection|
      ActiveRecord::Base.establish_connection(orig_connection.merge(advisory_locks: false))
      assert_not ActiveRecord::Base.lease_connection.advisory_locks_enabled?
      ActiveRecord::Base.establish_connection(orig_connection.merge(advisory_locks: true))
      assert_predicate ActiveRecord::Base.lease_connection, :advisory_locks_enabled?
    end
  end
end
```

`run_without_connection` (`vendor/rails/activerecord/test/support/connection_helper.rb`):

```ruby
def run_without_connection
  original_connection = ActiveRecord::Base.remove_connection  # returns db_config
  yield original_connection.configuration_hash
ensure
  ActiveRecord::Base.establish_connection(original_connection)
end
```

Trails has `Base.leaseConnection` (`base.ts:1244`) and `Base.establishConnection`
(`base.ts:1213`), but two pieces are missing to port this faithfully:

1. **`Base.removeConnection` returns `void`** (`connection-handling.ts:431`),
   whereas Rails' `remove_connection` returns the removed pool's `db_config` so
   the `ensure` can restore it. Without the return value there is nothing to
   restore from, so `run_without_connection` cannot be written.
2. **No `ConnectionHelper` / `runWithoutConnection` test helper** exists.

## Acceptance criteria

- [ ] `Base.removeConnection` returns the removed pool's `db_config` (the
      `DatabaseConfig` object), mirroring Rails `remove_connection`. Keep the
      existing teardown behavior; only add the return value. Update its
      api:compare mapping / tests as needed.
- [ ] Add a `runWithoutConnection` test helper mirroring Rails'
      `ConnectionHelper#run_without_connection` (save db_config via
      `removeConnection`, yield the configuration hash, restore via
      `establishConnection` in a `finally`).
- [ ] Rewrite `AdvisoryLocksEnabledTest` "advisory locks enabled?" body to use
      `Base.leaseConnection().isAdvisoryLocksEnabled()` for the base assertion
      and `Base.establishConnection({...config, advisoryLocks})` toggles wrapped
      in `runWithoutConnection`, dropping the local `makeActiveAdapter` helper.
      Bootstrap `Base`'s handler for the block (`setupHandlerSuite` /
      `establishFromTestConfig`) if needed.
- [ ] Test name unchanged; gate stays feature-only `advisory_locks`
      (`itIfSupports`). Verify on pg + mysql; `test:compare --gates` reports no
      regression.
- [ ] api:compare + test:compare delta non-negative.

Hard rules: NO node:_/process._ in tests; async fs only; no new third-party
runtime deps; 500 LOC ceiling; single PR from main; test names verbatim.
