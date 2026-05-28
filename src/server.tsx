import { createStartHandler } from '@tanstack/start/server'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export default createStartHandler({
  createRouter,
  routeTree,
})
