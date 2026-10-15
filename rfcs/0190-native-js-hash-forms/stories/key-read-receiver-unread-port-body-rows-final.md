---
title: "key-read-receiver-unread-port-body-rows-final"
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

Remainder of `key-read-receiver-unread-port-body-rows-remainder`, which converged
`actionview/routing-url-for.ts#ensureOnlyPathOption` and
`pg/connection.ts#conndefaultsHash`. Each row below in `pnpm parity:api:key-reads`
is still a body that is not Rails' body, and each needs a port larger than a
key-read fix:

- `trailties/src/generators/actions.ts#generate` queues into `pendingGenerators`
  (drained by `authentication-generator.ts#runPendingGenerators` and
  `commands/app.ts`). Rails is `railties/lib/rails/generators/actions.rb:332-339`:
  `args.extract_options!`, `options[:abort_on_failure] = !options[:inline]`,
  `rails_command "generate #{what} #{args.join(" ")}", options`. Needs
  `rails_command` (`actions.rb:391-403`): the `:inline` arm is
  `Rails::Command.invoke(command, args, **options)` (trails `command.ts#invoke`,
  async), the other `execute_command :rails` (`actions.rb:461-472`). The
  authentication generator's two `generate "migration ..."` calls
  (`authentication_generator.rb:51-52`) then go through it. Rails tests:
  `railties/test/generators/actions_test.rb:419-449`.
- `globalid/src/uri/gid.ts#build` reads `args` fields; Rails builds `parts` via
  `Util.make_components_hash(self, args)` and calls `super parts`
  (`vendor/globalid/.../lib/global_id/uri/gid.rb:90-101`). Needs `GID` to extend
  ruby-compat `URI::Generic` (`packages/ruby-compat/src/uri/generic.ts`) with
  `Generic.build` and `URI::Util.make_components_hash`.
- `activerecord/src/pg/connection.ts#reset` (`iopts[:host]`): vendored pg
  `lib/pg/connection.rb:575-586` (`@iopts_for_reset || conninfo_hash.compact`,
  `resolve_hosts` when `iopts[:host]` is present, `parse_connect_args`,
  `reset_start2`, `async_connect_or_reset(:reset_poll)`).
- `actionpack/src/action-dispatch/system-testing/driver.ts#constructor`: the
  selenium arm of `actionpack/lib/action_dispatch/system_testing/driver.rb:17-22`
  (`Browser.new(options[:using])`, `@browser.preload unless @options[:browser] == :remote`)
  is unported; needs `system_testing/browser.rb`.

## Acceptance criteria

- [ ] Each body above is rewritten to the Rails body.
- [ ] `pnpm parity:api:key-reads` lists none of these rows.
