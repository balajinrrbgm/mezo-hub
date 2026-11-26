import { formatEther, formatUnits } from 'viem'
import { useEcosystemStats } from '../hooks/useHub'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon?: string
  color?: string
}

function StatCard({ label, value, sub, icon, color = 'text-white' }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

type EcosystemStats = {
  activeTroves: bigint
  systemTCR: bigint
  borrowingRate: bigint
  spTotalDeposits: bigint
  btcPriceUSD: bigint
  hubTotalStaked: bigint
  hubTotalBTCDistributed: bigint
  hubProposalCount: bigint
  hubActiveProposals: bigint
}

export function AnalyticsDashboard() {
  const { data, isLoading } = useEcosystemStats()
  const stats = data as EcosystemStats | undefined

  const btcPrice = stats ? parseFloat(formatEther(stats.btcPriceUSD)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const tcrPct = stats ? (Number(stats.systemTCR) / 1e16).toFixed(1) : '—'
  const activeTroves = stats ? stats.activeTroves.toString() : '—'
  const spDeposits = stats ? parseFloat(formatUnits(stats.spTotalDeposits, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const hubStaked = stats ? parseFloat(formatUnits(stats.hubTotalStaked, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const btcDistributed = stats ? parseFloat(formatEther(stats.hubTotalBTCDistributed)).toFixed(6) : '—'
  const proposals = stats ? stats.hubProposalCount.toString() : '—'
  const activeProps = stats ? stats.hubActiveProposals.toString() : '—'
  const borrowRate = stats ? (Number(stats.borrowingRate) / 1e16).toFixed(2) : '—'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-xl text-white">Mezo Ecosystem Analytics</h2>
        {isLoading && (
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-3 h-3 border border-gray-600 border-t-gray-300 rounded-full animate-spin" />
            Live
          </span>
        )}
      </div>

      {/* MUSD Protocol stats */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">MUSD Protocol (on-chain)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="BTC Price" value={`$${btcPrice}`} icon="₿" color="text-btc" />
          <StatCard label="System Ratio" value={`${tcrPct}%`} sub="Total collateral ratio" icon="🛡" color="text-hub-green" />
          <StatCard label="Active Troves" value={activeTroves} sub="borrowing positions" icon="🏦" />
          <StatCard label="Stability Pool" value={`${spDeposits}`} sub="MUSD deposited" icon="🏊" color="text-hub-violet" />
        </div>
      </div>

      {/* MezoHub stats */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">MezoHub (this contract)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Staked" value={`${hubStaked}`} sub="MUSD staked" icon="🔒" color="text-mezo" />
          <StatCard label="BTC Distributed" value={`${btcDistributed}`} sub="BTC to stakers" icon="🎁" color="text-btc" />
          <StatCard label="Proposals" value={proposals} sub="total governance" icon="🗳" />
          <StatCard label="Active Votes" value={activeProps} sub="voting now" icon="⚡" color="text-hub-yellow" />
        </div>
      </div>

      {/* Info banner */}
      <div className="card bg-mezo/5 border-mezo/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-mezo/20 flex items-center justify-center shrink-0">
            <span className="text-lg">ℹ</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">How MezoHub Works</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Stake MUSD in the hub to earn BTC rewards funded by protocol revenue. 
              Your staked MUSD doubles as governance power — vote on proposals to shape the Mezo ecosystem.
              All stats are read directly from Mezo's deployed contracts on Matsnet testnet in real time.
            </p>
            <div className="mt-3 flex gap-3 text-xs">
              <span className="text-hub-green">✓ Min 100 MUSD to propose</span>
              <span className="text-hub-green">✓ 3-day voting period</span>
              <span className="text-hub-green">✓ BTC rewards (native Mezo token)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
