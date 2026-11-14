// Lazy route loader with stale-chunk recovery.
//
// Problem: after a new deploy, hashed JS chunks referenced by a cached
// index.html are deleted on GitHub Pages. The first navigation that needs
// such a chunk fails with "Failed to fetch dynamically imported module",
// leaving users on a blank/error screen until they manually refresh.
//
// Fix: on chunk load failure, reload the page ONCE so the browser picks up
// the fresh index.html (and its new chunk map). A sessionStorage guard
// prevents reload loops if the chunk is genuinely missing.

import { lazy } from 'react'

const RELOAD_GUARD_KEY = 'pivot_chunk_reload_guard'

export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const module = await factory()
      // Success — clear the guard so a later failure can reload again
      try { sessionStorage.removeItem(RELOAD_GUARD_KEY) } catch { /* private mode */ }
      return module
    } catch (err) {
      let alreadyReloaded = false
      try { alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD_KEY) === '1' } catch { /* ignore */ }

      if (!alreadyReloaded && typeof window !== 'undefined') {
        try { sessionStorage.setItem(RELOAD_GUARD_KEY, '1') } catch { /* ignore */ }
        window.location.reload()
        // Keep Suspense pending while the reload happens
        return new Promise(() => {})
      }

      // Already reloaded once and still failing — surface to ErrorBoundary
      throw err
    }
  })
}
