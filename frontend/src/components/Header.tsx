import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export function Header({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  const { isConnected } = useAccount()

  return (
    <header className="border-b border-hub-border bg-hub-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mezo to-hub-violet flex items-center justify-center shadow-lg shadow-mezo/30">
              <span className="text-white text-sm font-black">M</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white tracking-tight">MezoHub</span>
              <span className="ml-1.5 text-xs font-medium text-hub-violet/80 hidden sm:inline">Ecosystem</span>
            </div>
          </div>

          {/* Tabs */}
          {isConnected && (
            <nav className="hidden md:flex items-center gap-1 bg-hub-bg rounded-xl p-1">
              {['Analytics', 'Stake', 'Governance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.toLowerCase() ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-hub-card border border-hub-border rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-hub-green animate-pulse-slow" />
              <span className="text-xs text-gray-400">Matsnet</span>
            </div>
            <ConnectButton chainStatus="none" showBalance={false} accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
          </div>
        </div>
      </div>
    </header>
  )
}
