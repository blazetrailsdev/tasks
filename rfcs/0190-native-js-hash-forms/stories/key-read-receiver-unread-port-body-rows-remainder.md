---
title: "key-read-receiver-unread-port-body-rows-remainder"
status: draft
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
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

Remainder of `key-read-receiver-unread-port-body-rows-converge` (the controller,
db:system:change and devcontainer generator rows converged there). Each row below
in `pnpm parity:api:key-reads` is a body that is not Rails' body:

- `trailties/generators/actions.ts#generate` stubs into `pendingGenerators`; Rails is
  `railties/lib/rails/generators/actions.rb:332-339` (`args.extract_options!`,
  `options[:abort_on_failure] = !options[:inline]`, `rails_command`).
- `globalid/uri/gid.ts#build` reads `args`; Rails builds `parts` via
  `Util.make_components_hash` and calls `super parts` (`globalid/lib/global_id/uri/gid.rb:90-101`).
  Needs a ruby-compat `URI::Util.make_components_hash` / `URI::Generic.build`.
- `pg/connection.ts#conndefaultsHash` (`info[:keyword]`, `info[:val]`) and `#reset`
  (`iopts[:host]`), vendored pg `lib/pg/connection.rb`.
- `actionview/routing-url-for.ts#ensureOnlyPathOption` splits a `Parameters` arm
  (`"only_path"`) from a hash arm (`"onlyPath"`); Rails' body is uniform
  (`actionview/lib/action_view/routing_url_for.rb:143-147`). Needs one key spelling
  across `Parameters` and option hashes.
- `actiondispatch/system-testing/driver.ts#constructor`: the selenium arm of
  `actionpack/lib/action_dispatch/system_testing/driver.rb:17-22` (`@options[:browser]`) is unported.

## Acceptance criteria

- [ ] Each body above is rewritten to the Rails body.
- [ ] `pnpm parity:api:key-reads` lists none of these rows.
