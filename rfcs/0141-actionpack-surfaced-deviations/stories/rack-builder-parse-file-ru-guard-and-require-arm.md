---
title: "rack: Builder.parse_file takes the .ru guard and the require arm"
status: draft
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
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

`Rack::Builder.parse_file` (`vendor/rack/v3.1.14/lib/rack/builder.rb:65-72`) branches on the path:

```ruby
def self.parse_file(path, **options)
  if path.end_with?('.ru')
    return self.load_file(path, **options)
  else
    require path
    return Object.const_get(::File.basename(path, '.rb').split('_').map(&:capitalize).join(''))
  end
end
```

`packages/rack/src/builder.ts` `parseFile` delegates to `loadFile` for every path. Two things keep the
guard out of trails#8419, which moved the rackup-loading body into `loadFile`:

- The port's fixtures under `packages/rack/src/builder/` are named `*.ru.txt` and `an_underscore_app.txt`,
  so an `endsWith(".ru")` guard sends every one of them down the `require` arm.
  `builder.test.ts` "requires an_underscore_app not ending in .ru" loads its fixture as a rackup script.
- The `require` arm has no synchronous ESM form, and `parseFile` returns the app synchronously.

`parseFile` carries `@missingRailsCall map — CONVERGEABLE rack-builder-parse-file-ru-guard-and-require-arm`
for the `map(&:capitalize)` the missing arm makes.

Also open in `loadFile` (`builder.rb:86-98`): the `config.encoding == Encoding::UTF_8` guard on the BOM
strip (`:88`), and `config.sub!(/^__END__\n.*\Z/m, '')` (`:95`), which the port spells as a match on
`/^__END__\s*$/m` plus a `substring`.

## Acceptance criteria

- [ ] `parseFile` carries the `.ru` guard and a `require` arm that loads the module and reads the
      constant named after the file, with the fixtures renamed so the Rack spec names stay verbatim.
- [ ] The `@missingRailsCall map` receipt on `parseFile` is deleted.
- [ ] `loadFile`'s `__END__` strip is one `sub` over Rack's pattern.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=rack` show no `builder.ts#parseFile` row.
