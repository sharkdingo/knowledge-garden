# ADR 009: Model algorithm notes as a dedicated aggregate

## Status

Accepted.

## Context

An algorithm solution is not merely an article with a large code block. It has
stable problem metadata, one or more independently ordered approaches, a proof,
complexity claims, pitfalls, and multiple language implementations. Forcing
that structure into the ordinary article section model would make validation,
search, and future comparison features brittle.

The public site must also remain honest when the owner has not published any
problems. Sample solutions and browser-local content are not acceptable
production fallbacks.

## Decision

- Store problems, solutions, code blocks, references, and tag relations in
  focused D1 tables.
- Keep local solution/code identifiers inside the aggregate, while the adapter
  namespaces persisted identifiers by problem slug to prevent cross-problem
  collisions.
- Publish only complete aggregates; drafts may be partial and remain visible
  only in the authenticated Studio.
- Keep problem statements as an owner-authored summary and link to the original
  platform instead of copying a copyrighted statement.
- Render the public explanation in the sequence: statement, constraints,
  intuition, derivation, correctness, complexity, pitfalls, implementations.
- Store all visitor-facing notebook copy in the D1 site profile and expose the
  principal copy controls in Studio.
- Save tags, the aggregate root, solutions, code blocks, and relations in one D1
  batch so a failed write cannot leave a partially updated note.
- Require only stable identity fields when saving a draft; enforce the complete
  explanation contract only when publishing.
- Include published solutions in global search, RSS, and the sitemap.

## Consequences

The article and algorithm domains can evolve independently behind focused
repository ports. Adding execution, judge synchronization, spaced repetition,
or per-language benchmarks later does not require weakening the article model.
The public notebook remains intentionally empty until real content is
published. New notes enter through the Studio aggregate, so a fresh deployment
contains no sample problem, solution, code block, tag, or external reference.
Integration tests create transaction-local fixtures instead of shipping them as
production content.
