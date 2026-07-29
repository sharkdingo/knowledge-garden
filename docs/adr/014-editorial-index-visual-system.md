# ADR 014: Editorial index visual system

## Status

Accepted.

## Context

The public site accumulated several individually reasonable effects: a
full-viewport image, entrance dialog, spatial pointer response, glass controls,
decorative grids, animated daily marks, and card elevation. Together they made
the interface feel busier while weakening the writing hierarchy.

The redesign studies content-led independent publishing: Craig Mod's clear
separation of books, essays, and newsletters; Frank Chimero's compact identity
and archive; Low-tech Magazine's explicit publication index; and Robin Sloan's
quiet, directory-like personal site.

## Decision

- Treat the homepage as a publication index rather than an application
  dashboard.
- Establish identity through an asymmetric grid, editorial typography, rules,
  and whitespace.
- Keep one persisted accent color and use it only for state and meaningful
  links.
- Remove the first-visit entrance and image-led hero from the public journey.
- Retain daily content and visitor response, but present it as a marginal note
  after the writing stream.
- Keep all palette values in the persisted site profile. CSS consumes semantic
  tokens and does not own theme colors.
- Preserve the existing server-first modular monolith, D1 repositories, and
  Studio editing boundary.

## Consequences

The homepage starts faster, has less client-side state, and gives writing the
strongest visual weight. Public routes share one calmer typographic system.
Expressive experiments remain available in the playground instead of competing
with reading.
