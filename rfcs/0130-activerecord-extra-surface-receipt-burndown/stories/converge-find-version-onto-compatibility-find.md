---
title: "converge-find-version-onto-compatibility-find"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`findVersion` (`packages/activerecord/src/migration/compatibility.ts:43-61`) resolves an
unknown migration version by **falling back to the nearest lower registered version**. Rails
does not: `Compatibility.find`
(`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:6-14`) is an exact
constant lookup that raises for anything it does not find.

```ruby
def self.find(version)
  version = version.to_s
  name = "V#{version.tr('.', '_')}"
  unless const_defined?(name)
    versions = constants.grep(/\AV[0-9_]+\z/).map { |s| s.to_s.delete("V").tr("_", ".").inspect }
    raise ArgumentError, "Unknown migration version #{version.inspect}; expected one of #{versions.sort.join(', ')}"
  end
  const_get(name)
end
```

Three divergences, in increasing order of size:

1. **The fallback itself.** `Migration[7.0]` silently resolves to the newest version at or
   below 7.0 instead of raising, so a migration written for an older release runs under
   today's semantics — the exact failure `Compatibility` exists to prevent (its own comment at
   `:16-19`: "if you write a migration on Rails 6.1, then upgrade to Rails 7, the migration
   should do the same thing to your database as it did when you were running Rails 6.1").
2. **The error class and message.** trails raises `MigrationError` with
   `Unknown migration version: 8.5. Registered versions: 8.0`; Rails raises `ArgumentError`
   with `Unknown migration version "8.5"; expected one of "8.0"` — note `to_s` before
   `inspect`, so the version is quoted, and the expected list is `inspect`ed and sorted.
3. **The missing `V*` classes.** Rails defines nine (`V8_0` … `V4_2`,
   `compatibility.rb`); trails defines **zero** and registers only `Current`. This is why
   removing the fallback cannot be a drive-by: with one entry in the registry, exact lookup
   makes every `Migration[7.0]` / `Migration[6.1]` in existing user migrations raise where it
   previously resolved. The fallback is masking the absent classes.

## Converged shape

Port `Compatibility.find` exactly — `to_s`, `V#{version.tr('.', '_')}` lookup, `ArgumentError`
with Rails' message — and drop the `compareVersions` / `parseVersion` helpers, which exist only
to serve the fallback and have no Rails counterpart.

Sequence matters: the `V*` classes have to land first, or the exact lookup turns a silent
wrong-semantics bug into a hard failure for every migration pinned to an older version. Either
port them with their behaviour deltas, or land the exact lookup together with a deliberate
decision about which versions trails claims to support.

trails#7729 removed the one test that pinned the fallback
(`findVersion falls back to nearest lower version`, migrator.trails.test.ts) so the deviation
is no longer codified, but left the behaviour in place for the reason above.

## Acceptance criteria

- [ ] `findVersion` is an exact lookup over the registry, with no nearest-lower fallback.
- [ ] It raises `ArgumentError` with Rails' message shape: `Unknown migration version "8.5"; expected one of "8.0"` (version `to_s`-then-`inspect`ed, expected list `inspect`ed and sorted).
- [ ] `compareVersions` and `parseVersion` are deleted with the fallback they served.
- [ ] The `Compatibility::V*` classes trails needs are registered first, so no previously-resolving `Migration[x]` starts raising without that being a reviewed decision.
- [ ] `findVersion`'s `@noRailsEquivalent CONVERGEABLE` receipt is re-evaluated: `Compatibility.find` is the Rails counterpart, so the ported shape should be matched rather than receipted.
