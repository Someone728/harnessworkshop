---
name: refactor-cleanup
description: For when a piece of code has grown messy and needs a proper cleanup pass — extra abstraction, duplicated logic, confusing structure. Most relevant in src/state, src/features, and src/components.
---

# Refactor Cleanup

This one's for structural problems, not surface style: an abstraction that doesn't earn its
keep, two modules doing the same job, logic that's hard to follow. Simplify as you go rather
than filing a separate cleanup task for later — by the time anyone gets back to it, the
context is gone.
