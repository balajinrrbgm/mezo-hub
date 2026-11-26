import { ethers } from 'hardhat'

// Matsnet deployed addresses
const MUSD = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503'
const TROVE_MANAGER = '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0'
const BORROWER_OPERATIONS = '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5'
const STABILITY_POOL = '0x1CCA7E410eE41739792eA0A24e00349Dd247680e'
const PRICE_FEED = '0x86bCF0841622a5dAC14A313a15f96A95421b9366'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying MezoEcosystemHub...')
  console.log('Deployer:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'BTC')

  const Hub = await ethers.getContractFactory('MezoEcosystemHub')
  const hub = await Hub.deploy(
    MUSD,
    TROVE_MANAGER,
    BORROWER_OPERATIONS,
    STABILITY_POOL,
    PRICE_FEED
  )
  await hub.waitForDeployment()

  const address = await hub.getAddress()
  console.log('\n✓ MezoEcosystemHub deployed to:', address)
  console.log('\nUpdate ADDRESSES.MEZO_HUB in mezo-hub/frontend/src/constants/addresses.ts')
  console.log('\nVerify on explorer:')
  console.log(`https://explorer.test.mezo.org/address/${address}`)
}

main().catch(console.error)
