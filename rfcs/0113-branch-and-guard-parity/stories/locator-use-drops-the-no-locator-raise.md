---
title: "locator-use-drops-the-no-locator-raise"
status: done
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: 7287
claim: "2026-08-31T09:54:12Z"
assignee: "locator-use-drops-the-no-locator-raise"
blocked-by: null
closed-reason: null
---

## Context

`Locator.use` (`vendor/globalid/lib/global_id/locator.rb:130-136`) opens with a
guard the port drops entirely:

```ruby
def use(app, locator = nil, &locator_block)
  raise ArgumentError, 'No locator provided. Pass a block or an object that responds to #locate.' unless locator || block_given?

  URI::GID.validate_app(app)

  @locators[normalize_app(app)] = locator || BlockLocator.new(locator_block)
end
```

`packages/globalid/src/locator.ts#use` begins at `validateApp`: the arm-parity
skeleton reads `ref:validateApp if ref:set ref:normalizeApp if new:BlockLocator`
against Rails' `if if ref:block_given? throw ref:validate_app …`, i.e. a missing
`if` and a missing `throw`. Calling `use(app)` with neither a locator nor a
block therefore stores a `BlockLocator` over an absent block in trails, where
Rails raises.

Surfaced by the RFC 0113 noise-floor audit (row 20 of the seed-113 sample,
`docs/infrastructure/arm-mismatch-noise-floor.md`), classified `real`.

## Converged shape

Restore the guard as Rails writes it — first statement, `ArgumentError`, the
message verbatim — with `locator || block` as the condition (trails takes the
block as a parameter, so `block_given?` is the parameter's presence).

## Acceptance criteria

- [ ] `use(app)` with neither a locator nor a block raises `ArgumentError` with
      Rails' message, before `validateApp` runs.
- [ ] A test covers the raise and that a locator-only and a block-only call both
      still register.
- [ ] The row leaves `pnpm parity:api:arms:report`.
