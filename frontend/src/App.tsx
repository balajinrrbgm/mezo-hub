import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Header } from './components/Header'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { StakingPanel } from './components/StakingPanel'
import { GovernancePanel } from './components/GovernancePanel'
import { useUserState } from './hooks/useHub'

function HeroSection() {
  return (
    <div className="text-center py-20 px-4">
      <div className="inline-flex items-center gap-2 bg-mezo/10 border border-mezo/20 rounded-full px-4 py-1.5 mb-6">
        <span className="w-2 h-2 rounded-full bg-mezo animate-pulse-slow" />
        <span className="text-xs font-medium text-gray-300">Mezo Ecosystem Participation Hub</span>
      </div>
      <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4">
        Stake MUSD.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-mezo to-hub-violet">
          Earn BTC. Govern.
        </span>
      </h1>
      <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
        MezoHub is the central coordination layer for the Mezo ecosystem. Stake MUSD to earn native BTC rewards
        and shape the future of Bitcoin DeFi through on-chain governance.
      </p>
      <ConnectButton label="Connect & Join Hub" />
      <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 mt-8">
        <div className="flex items-center gap-1.5"><span className="text-hub-green">✓</span> BTC Native Rewards</div>
        <div className="flex items-center gap-1.5"><span className="text-hub-green">✓</span> On-Chain Governance</div>
        <div className="flex items-center gap-1.5"><span className="text-hub-green">✓</span> Live Protocol Analytics</div>
        <div className="flex items-center gap-1.5"><span className="text-hub-green">✓</span> No Lock-up Period</div>
      </div>
    </div>
  )
}

function UserBar() {
  const user = useUserState()
  if (!user.address) return null

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      <div className="bg-hub-card border border-hub-border rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-mezo text-sm">◈</span>
        <div>
          <p className="text-xs text-gray-500">Staked MUSD</p>
          <p className="text-sm font-bold text-white">{user.stakedFormatted}</p>
        </div>
      </div>
      <div className="bg-hub-card border border-hub-border rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-btc text-sm">₿</span>
        <div>
          <p className="text-xs text-gray-500">Pending BTC</p>
          <p className="text-sm font-bold text-btc">{user.pendingFormatted}</p>
        </div>
      </div>
      <div className="bg-hub-card border border-hub-border rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-hub-violet text-sm">⚖</span>
        <div>
          <p className="text-xs text-gray-500">MUSD Balance</p>
          <p className="text-sm font-bold text-white">{user.musdBalanceFormatted}</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('analytics')

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!isConnected ? (
          <HeroSection />
        ) : (
          <div className="pt-8">
            <UserBar />

            {/* Mobile tab nav */}
            <div className="flex gap-2 p-1 bg-hub-dark rounded-xl mb-6 md:hidden">
              {['analytics', 'stake', 'governance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                    activeTab === tab ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'stake' && <StakingPanel />}
            {activeTab === 'governance' && <GovernancePanel />}
          </div>
        )}
      </main>

      <footer className="border-t border-hub-border py-8 mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div>MezoHub — Built for Mezo Hackathon 2024 · Matsnet Testnet</div>
          <div className="flex items-center gap-4">
            <a href="https://explorer.test.mezo.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Explorer</a>
            <a href="https://mezo.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Mezo.org</a>
            <a href="https://github.com/mezo-org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
