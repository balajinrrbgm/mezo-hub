import { getConfig } from '@mezo-org/passport'
import { QueryClient } from '@tanstack/react-query'

export const wagmiConfig = getConfig({
  appName: 'MezoHub – Ecosystem Participation Hub',
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchInterval: 20_000,
    },
  },
})
