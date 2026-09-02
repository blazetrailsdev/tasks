---
title: "Annotation.extensions is an array where Rails keys a Hash by the generated Regexp"
status: draft
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `0126/source-annotation-registrars-belong-on-annotation`
(PR #7388), which moved the three registrars onto `Annotation` but left the
register's container shape alone as pre-existing. The reviewer confirmed it was
out of scope for that PR; this story converges it.

Rails' register is a **Hash keyed by the generated Regexp**:

```ruby
def self.extensions
  @@extensions ||= {}
end

def self.register_extensions(*exts, &block)
  extensions[/\.(#{exts.join("|")})$/] = block
end
```

(`railties/lib/rails/source_annotation_extractor.rb:92-94, 98-99`), consumed by

```ruby
extension = Annotation.extensions.detect do |regexp, _block|
  regexp.match(item)
end
```

(`:177-178`).

trails holds it as an **array** —
`packages/trailties/src/source-annotation-extractor.ts`:
`static extensions: Array<{ test: RegExp; builder: ExtensionBuilder }> = []`,
with `registerExtensions` doing `this.extensions.push({...})` and `findIn`
doing `Annotation.extensions.find((e) => e.test.test(item))`.

The difference is behavioural, not cosmetic. Ruby Hash keys compare Regexp by
VALUE, so re-registering an extension set already registered **replaces** the
block and keeps the original insertion position. The array **appends**, and
because the lookup takes the FIRST match, the stale builder keeps winning — a
caller who re-registers `("ts", "js", ...)` to change the comment syntax gets
silently ignored. This is exactly what a `Rails.application.config` initializer
overriding a built-in registration would do.

## Converged shape

`extensions` becomes a `Map` keyed by the pattern SOURCE string. A JS `Map`
compares keys by identity and two structurally-equal `RegExp` objects are
distinct keys, so the source string is the only spelling that reproduces a Ruby
Hash's value equality; `Map` preserves insertion order and `set` on an existing
key replaces in place, which is Ruby Hash semantics exactly. The lookup mirrors
`detect`, and adopts Rails' `extension` / `pattern` locals.

This shape is already written and verified — the working patch is below, and the
regression test was confirmed to FAIL on the append semantics and pass on
replace. It did not make PR #7388 only because the PR merged while the change
was being validated.

```ts
  /**
   * Rails' register is a Hash keyed by the generated Regexp
   * (`source_annotation_extractor.rb:92-94,99`), so registering the same
   * extension set twice REPLACES the block and keeps the original insertion
   * position. A JS `Map` compares keys by identity, and two structurally equal
   * `RegExp` objects are distinct keys, so the key is the pattern SOURCE — the
   * only spelling that gives a Ruby Hash's value equality. `find` below walks
   * it in insertion order, mirroring `detect` (:177).
   */
  static extensions = new Map<string, ExtensionBuilder>();

  static registerExtensions(...exts: [...string[], ExtensionBuilder]): void {
    const block = exts.pop() as ExtensionBuilder;
    this.extensions.set(`\\.(${(exts as string[]).join("|")})$`, block);
  }
```

and in `findIn`:

```ts
      const extension = [...Annotation.extensions].find(([regexp]) => new RegExp(regexp).test(item));
      if (!extension) continue;
      const pattern = extension[1](this.tag);
      const annotations = await extractFromFile(item, pattern);
```

`resetAnnotationRegistry` resets it with `new Map()`.

## Acceptance criteria

- `Annotation.extensions` is a `Map` whose `set` replaces an already-registered
  extension set in place, at Rails' `extensions` name.
- `findIn` walks it in insertion order, mirroring `detect`
  (`source_annotation_extractor.rb:177-178`), and uses Rails' `extension` /
  `pattern` locals.
- A test asserts a second `registerExtensions` call for a set the defaults
  already registered wins over the built-in builder. It must FAIL if the
  container appends rather than replaces (verified against the array shape).
- `pnpm parity:api --package trailties` delta non-negative;
  `parity:api:extra --package trailties` lists nothing new for
  `source-annotation-extractor.ts`.

## Not in scope (checked, do not re-derive)

Rails' `register_extensions` block may return `nil` (`next unless pattern`,
`:184`) or a `PatternExtractor` / `ParserExtractor` rather than a bare Regexp
(`:186-190`); trails' `ExtensionBuilder` returns `RegExp` only and the port has
no extractor classes. That is a separate, larger gap — the regex-only
`PatternExtractor` limitation the file's own class docstring already records —
and is not part of this story.
