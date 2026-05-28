import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
