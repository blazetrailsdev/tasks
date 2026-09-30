---
title: "Port actions_spec.rb (initialize, accessors, inside, in_root, apply, run, run_ruby_script, thor)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-actions-apply", "port-thor-spec-group-and-invoke-fixtures"]
deps-rfc: []
est-loc: 500
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RSpec port of `vendor/thor/v1.3.2/spec/actions_spec.rb`.

Port each case at its Ruby name (`describe` / `it` strings unchanged; `parity:test`
matches on them). Expectations map `expect(x).to eq(y)` → `expect(x).toEqual(y)`,
`raise_error(K, /m/)` → `rejects.toThrow` / `toThrow`, and `capture(:stdout) { }` → the
spec helper's `capture("stdout", async () => ...)`. A case that cannot run under trails
(for example, one that shells out to `ruby`) is `it.skip` with the RFC's reason, not deleted.

`packages/trailties/src/thor/actions.test.ts` (trails#8269) already ports 6 cases of `actions_spec.rb`'s `#source_paths_for_search` / `#find_in_source_paths`; it is folded into this file.

## Acceptance criteria

- [ ] Every case listed below exists at its Ruby name and passes. `pnpm parity:test` credits it
      in the `thor` block.
- [ ] No case is renamed. A case that exposes a port bug is fixed in the port (or filed against
      this RFC with the Ruby `file:line`), not rewritten.

## Cases to port (63)

`vendor/thor/v1.3.2/spec/actions_spec.rb`:

- `on include > adds runtime options to the base class` (`:17`)
- `#initialize > has default behavior invoke` (`:26`)
- `#initialize > can have behavior revoke` (`:30`)
- `#initialize > when behavior is set to force, overwrite options` (`:34`)
- `#initialize > when behavior is set to skip, overwrite options` (`:41`)
- `accessors > #destination_root= > gets the current directory and expands the path to set the root` (`:51`)
- `accessors > #destination_root= > does not use the current directory if one is given` (`:57`)
- `accessors > #destination_root= > uses the current directory if none is given` (`:64`)
- `accessors > #relative_to_original_destination_root > returns the path relative to the absolute root` (`:71`)
- `accessors > #relative_to_original_destination_root > does not remove dot if required` (`:75`)
- `accessors > #relative_to_original_destination_root > always use the absolute root` (`:79`)
- `accessors > #relative_to_original_destination_root > creates proper relative paths for absolute file location` (`:85`)
- `accessors > #relative_to_original_destination_root > doesn't remove the root path from the absolute path if it is not at the beginning` (`:89`)
- `accessors > #relative_to_original_destination_root > doesn't removes the root path from the absolute path only if it is only the partial name of the directory` (`:94`)
- `accessors > #relative_to_original_destination_root > removes the root path from the absolute path only once` (`:99`)
- `accessors > #relative_to_original_destination_root > does not fail with files containing regexp characters` (`:104`)
- `accessors > #relative_to_original_destination_root > #source_paths_for_search > add source_root to source_paths_for_search` (`:110`)
- `accessors > #relative_to_original_destination_root > #source_paths_for_search > keeps only current source root in source paths` (`:114`)
- `accessors > #relative_to_original_destination_root > #source_paths_for_search > customized source paths should be before source roots` (`:119`)
- `accessors > #relative_to_original_destination_root > #source_paths_for_search > keeps inherited source paths at the end` (`:124`)
- `accessors > #find_in_source_paths > raises an error if source path is empty` (`:131`)
- `accessors > #find_in_source_paths > finds a template inside the source path` (`:137`)
- `#inside > executes the block inside the given folder` (`:150`)
- `#inside > changes the base root` (`:156`)
- `#inside > creates the directory if it does not exist` (`:162`)
- `#inside > returns the value yielded by the block` (`:168`)
- `#inside > when pretending > no directories should be created` (`:173`)
- `#inside > when pretending > returns the value yielded by the block` (`:178`)
- `#inside > when verbose > logs status` (`:184`)
- `#inside > when verbose > uses padding in next status` (`:190`)
- `#inside > when verbose > removes padding after block` (`:198`)
- `#in_root > executes the block in the root folder` (`:208`)
- `#in_root > changes the base root` (`:214`)
- `#in_root > returns to the previous state` (`:220`)
- `#apply > accepts a URL as the path` (`:240`)
- `#apply > accepts a secure URL as the path` (`:248`)
- `#apply > accepts a local file path with spaces` (`:256`)
- `#apply > opens a file and executes its content in the instance binding` (`:262`)
- `#apply > applies padding to the content inside the file` (`:267`)
- `#apply > logs its status` (`:271`)
- `#apply > does not log status` (`:275`)
- `#run > when not pretending > executes the command given` (`:288`)
- `#run > when not pretending > logs status` (`:292`)
- `#run > when not pretending > does not log status if required` (`:296`)
- `#run > when not pretending > accepts a color as status` (`:300`)
- `#run > when pretending > doesn't execute the command` (`:307`)
- `#run > when not capturing > aborts when abort_on_failure is given and command fails` (`:315`)
- `#run > when not capturing > succeeds when abort_on_failure is given and command succeeds` (`:319`)
- `#run > when not capturing > supports env option` (`:323`)
- `#run > when capturing > aborts when abort_on_failure is given, capture is given and command fails` (`:329`)
- `#run > when capturing > succeeds when abort_on_failure is given and command succeeds` (`:333`)
- `#run > when capturing > supports env option` (`:337`)
- `#run > aborts when command fails even if abort_on_failure is not given` (`:349`)
- `#run > does not abort when abort_on_failure is false even if the command fails` (`:353`)
- `#run_ruby_script > executes the ruby script` (`:365`)
- `#run_ruby_script > logs status` (`:369`)
- `#run_ruby_script > does not log status if required` (`:373`)
- `#thor > executes the thor command` (`:379`)
- `#thor > converts extra arguments to command arguments` (`:384`)
- `#thor > converts options hash to switches` (`:389`)
- `#thor > logs status` (`:397`)
- `#thor > does not log status if required` (`:402`)
- `#thor > captures the output when :capture is given` (`:407`)
