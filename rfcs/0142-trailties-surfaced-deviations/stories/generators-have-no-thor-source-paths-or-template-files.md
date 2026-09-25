---
title: "Generators have no Thor source_paths / find_in_source_paths or template files"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
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

Blocks `migration-template-expands-the-source-template-path`, whose first
statement must be `File.expandPath(findInSourcePaths(String(source)))`
(`railties/lib/rails/generators/migration.rb:57`).

`find_in_source_paths` is Thor's (`thor/actions.rb:133-157`, thor 1.3.2):

```ruby
def find_in_source_paths(file)
  possible_files = [file, file + TEMPLATE_EXTNAME]
  relative_root = relative_to_original_destination_root(destination_root, false)
  source_paths.each do |source|
    possible_files.each do |f|
      source_file = File.expand_path(f, File.join(source, relative_root))
      return source_file if File.exist?(source_file)
    end
  end
  message = "Could not find #{file.inspect} in any of your source paths. ".dup
  unless self.class.source_root
    message << "Please invoke #{self.class.name}.source_root(PATH) with the PATH containing your templates. "
  end
  message << (source_paths.empty? ? "Currently you have no source paths." :
              "Your current source paths are: \n#{source_paths.join("\n")}")
  raise Error, message
end
```

It rests on machinery trailties does not have at all:

- `source_paths` / `source_paths_for_search` / `source_root` (`thor/actions.rb:22-45,127`)
  and Rails' `Generators::Base.source_root` / `default_source_root` /
  `inherited` source-path registration (`railties/lib/rails/generators/base.rb:34-36,227-256`).
  `grep -rn "sourceRoot\|sourcePaths" packages/trailties/src` finds nothing.
- `relative_to_original_destination_root` and `Thor::Error`.
- Template files on disk. trailties generators build their output as strings
  in code (`packages/trailties/src/generators/migration-generator.ts`,
  `model-generator.ts`); there is no `templates/` directory next to any
  generator, and Rails' `active_record/migration/templates/*.rb.tt` are not ported.

Thor is not vendored under `vendor/` (it is installed with the local Ruby at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/thor-1.3.2`), so the port
needs a `vendor:fetch` source entry first for `parity:api` to score it.

`migrationTemplate` (`packages/trailties/src/generators/migration.ts`) has no
call site in `packages/trailties/src/generators/` today; the migration generator
writes through `createMigration` directly.

## Acceptance criteria

- thor is vendored (`vendor/sources.ts`) so its methods are scored.
- `sourceRoot` / `sourcePaths` / `findInSourcePaths` exist on the generator
  host with Thor's and Rails' names, `findInSourcePaths` raising Thor's
  `Could not find … in any of your source paths.` message.
- At least one generator (the migration generator) reads a template file
  found through its source paths, so the machinery has a caller.
