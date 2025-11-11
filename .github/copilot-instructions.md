# Crowdfunding Platform - GitHub Copilot Instructions

## Project Overview
A decentralized crowdfunding platform built on BSC (Binance Smart Chain) with milestone-based funding, community voting, and token rewards. Campaign creators can launch projects, donors can contribute and earn tokens, and the community votes on milestone completion.

## Tech Stack

### Smart Contracts
- **Solidity ^0.8.24** - Smart contract language
- **Hardhat 2.19.0** - Development environment
- **OpenZeppelin Contracts** - Security & standards
- **ethers v6.4.0** - Ethereum library

### Subgraph (Indexing)
- **The Graph Protocol** - Blockchain data indexing
- **GraphQL** - Query language
- **AssemblyScript** - Subgraph mapping language
- **Network:** BSC Testnet (chapel)
- **Deployed Subgraph:** crowd-funding

### Frontend (To Be Built)
- **Next.js 14+** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **RainbowKit** - Wallet connection
- **wagmi/viem** - Ethereum interactions
- **Apollo Client** - GraphQL client
- **Arweave** - Decentralized storage for content

## Deployed Contracts (BSC Testnet)

```typescript
const CONTRACTS = {
  CrowdFundingToken: "0x9C04995284E6015fF45068dc78f6Dd8263581dF9",
  CrowdFundingImplementation: "0xc08fC6540990807a04F04e2cefDb9d4aA6024c5C",
  CrowdFundingFactory: "0x9C413E92bf610Ccd0Cd044c3ba25876764AB8FDD",
  chainId: 97,
  network: "bsc-testnet"
};
```

## Contract Architecture

### CrowdFundingFactory
- Creates new campaigns via minimal proxy (clones)
- Manages platform fees (0.000000001 ETH)
- Tracks all campaigns and owner mappings
- Handles factory fund withdrawals

**Key Functions:**
- `createNewCrowdFundingContract(detailsId, category, title, goal, duration)` - Create campaign
- `getDeployedCrowdFundingContracts()` - Get all campaigns
- `getCampaignsByOwner(address)` - Get user's campaigns
- `getFundingFee()` - Get current creation fee

### CrowdFunding (Campaign Contract)
- Milestone-based funding (max 3 milestones)
- Community voting on milestones (14-day default voting period)
- Donor withdrawal with penalties (10% tax)
- Token rewards (1:1 with donation amount)

**Key Functions:**
- `giveDonationToCause()` - Make donation
- `createNewMilestone(milestoneCID)` - Create milestone (owner only)
- `voteOnMilestone(support)` - Vote on milestone (donors only)
- `withdrawMilestone()` - Withdraw milestone funds (owner only)
- `retrieveDonatedAmount()` - Withdraw donation with penalty (donors)
- `endCampaign()` - End campaign early (owner only)

**Withdrawal Rules:**
- Before any milestone: 100% - 10% tax
- After 1st milestone: 66.67% - 10% tax
- After 2nd milestone: 33.33% - 10% tax
- After 3rd milestone: Cannot withdraw

**Milestone Approval:**
- Requires 2/3 (66.67%) support votes
- Vote weight = donation amount
- Voting period = 14 days (configurable)

### CrowdFundingToken (MWG-DT)
- ERC20 token with 1 billion cap
- Minted 1:1 on donations
- Burned on donor withdrawals
- Only campaign contracts can mint/burn

## Categories
```typescript
enum Category {
  TECHNOLOGY = 0,
  ARTS = 1,
  COMMUNITY = 2,
  EDUCATION = 3,
  ENVIRONMENT = 4,
  HEALTH = 5,
  SOCIAL = 6,
  CHARITY = 7,
  OTHER = 8
}
```

## Subgraph Schema

### Key Entities

**Campaign:**
- `id` - Contract address
- `campaignCID` - Arweave content ID
- `category` - Category enum (0-8)
- `amountSought` - Funding goal
- `amountRaised` - Current funding
- `backers` - Number of donors
- `campaignRunning` - Active status
- `milestone[]` - Associated milestones
- `donations[]` - All donations
- `owner` - CampaignCreator

**Milestone:**
- `id` - Unique ID
- `milestoneCID` - Arweave content ID
- `status` - 0=Default, 1=Pending, 2=Approved, 3=Declined
- `periodToVote` - Voting deadline timestamp
- `votes[]` - All votes
- `campaign` - Parent campaign

**Donor:**
- `id` - Wallet address
- `totalDonated` - Lifetime donations
- `totalWithdrawn` - Lifetime withdrawals
- `donations[]` - All donations
- `withdrawals[]` - All withdrawals

**Vote:**
- `id` - Unique ID
- `voter` - Voter address
- `weight` - Vote weight (donation amount)
- `support` - true=support, false=against
- `milestone` - Associated milestone

**CampaignContent (Arweave):**
- `details` - Full description
- `title` - Campaign title
- `media[]` - Image/video URLs
- `hash` - Arweave transaction hash

## Frontend Page Structure

### Public Pages (No Wallet Required)

1. **Landing/Home** (`/`)
   - Hero with value proposition
   - Featured campaigns
   - Platform statistics
   - Category showcase
   - How it works

2. **Explore/Browse** (`/projects`)
   - Campaign grid/list
   - Filters: category, status, progress
   - Sort: newest, ending soon, most funded, most backers
   - Full-text search
   - Pagination

3. **Campaign Detail** (`/projects/[address]`)
   - Full campaign info
   - Media gallery
   - Funding progress
   - Milestone timeline
   - Recent donations
   - Donate CTA

4. **Search Results** (`/search`)
   - Search query display
   - Filtered results
   - Same filters as Explore

5. **About/How It Works** (`/about`)
   - Platform mechanics
   - Creator guide
   - Donor guide
   - Token rewards explanation
   - FAQ

### Wallet-Connected Pages

6. **Create Campaign** (`/new-project`)
   - Multi-step form
   - Arweave upload
   - Fee display
   - Transaction confirmation

7. **User Dashboard** (`/dashboard`)
   - My Campaigns tab
   - My Donations tab
   - My Votes tab
   - My Tokens tab
   - Activity feed

8. **Campaign Management** (`/projects/[address]/manage`)
   - Owner-only access
   - Campaign statistics
   - Donor list
   - Create milestone
   - Withdraw funds
   - End campaign

9. **Create Milestone** (`/projects/[address]/milestone/new`)
   - Owner-only access
   - Milestone form
   - Arweave upload
   - Preview

10. **Milestone Detail** (`/projects/[address]/milestone/[id]`)
    - Milestone content
    - Vote tallies
    - Voting countdown
    - Vote button
    - Voter list

11. **Donation Flow** (`/projects/[address]/donate`)
    - Donation amount input
    - Token reward preview
    - Transaction confirmation
    - Success modal

12. **Vote on Milestone** (Modal/Page)
    - Support/Against options
    - Vote weight display
    - Confirm vote

### Admin Pages

13. **Admin Dashboard** (`/admin`)
    - Factory owner only
    - Platform statistics
    - Set funding fee
    - Withdraw factory funds

### Utility Pages

14. **User Profile** (`/user/[address]`)
    - Public user view
    - Campaigns created
    - Total raised
    - Total donated

15. **Category Page** (`/category/[categoryName]`)
    - Category-filtered campaigns
    - Category statistics

16. **Statistics** (`/stats`)
    - Platform-wide analytics
    - Charts and graphs
    - Category breakdown

17. **404 Page**
    - Not found handling
    - Connect wallet prompt

18. **Transaction Status** (`/tx/[hash]`)
    - Transaction tracking
    - Block explorer link
    - Success/failure state

## Design Guidelines

### Color Scheme
- Primary: Modern, trustworthy blue
- Secondary: Success green for funding progress
- Accent: Warm color for CTAs
- Neutrals: Gray scale for text and backgrounds
- Status colors: Green (active), Yellow (pending), Red (declined), Gray (ended)

### Typography
- Headings: Bold, clear hierarchy
- Body: Readable, 16px minimum
- Data/Numbers: Monospace for amounts and addresses

### Components
- Campaign cards with image, title, progress bar, stats
- Milestone timeline (vertical/horizontal)
- Vote buttons (Support/Against)
- Token balance display
- Wallet connection button
- Transaction status indicators
- Progress bars with percentage
- Category badges
- Time remaining countdown
- Donation input with validation

### UX Principles
- Clear CTAs on every page
- Transaction feedback (pending, success, error)
- Wallet connection prompts when needed
- Loading states for blockchain data
- Error handling with helpful messages
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA)

## Code Conventions

### File Naming
- Components: PascalCase (e.g., `CampaignCard.tsx`)
- Pages: kebab-case (e.g., `[address].tsx`)
- Utilities: camelCase (e.g., `formatEther.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `CONTRACT_ADDRESSES.ts`)

### Component Structure
```typescript
// 1. Imports
import { FC } from 'react';
import { useContractRead } from 'wagmi';

// 2. Types/Interfaces
interface CampaignCardProps {
  address: string;
  title: string;
}

// 3. Component
export const CampaignCard: FC<CampaignCardProps> = ({ address, title }) => {
  // Hooks
  const { data, isLoading } = useContractRead(...);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return (
    <div>...</div>
  );
};
```

### GraphQL Queries
- Place in `lib/queries/` directory
- Export as named constants
- Use fragments for reusable fields
- Type with generated types

### Contract Interactions
- Use wagmi hooks for reads
- Use wagmi hooks for writes with error handling
- Show transaction pending/success/error states
- Update UI optimistically where appropriate

### State Management
- React Context for global state (wallet, user preferences)
- Local state for component-specific data
- Server state with Apollo Client (subgraph data)
- Form state with React Hook Form

### Error Handling
```typescript
try {
  const tx = await writeContract(...);
  await tx.wait();
  toast.success('Transaction confirmed');
} catch (error) {
  if (error.code === 4001) {
    toast.error('Transaction rejected');
  } else {
    toast.error('Transaction failed');
  }
}
```

## Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_FACTORY_ADDRESS=0x9C413E92bf610Ccd0Cd044c3ba25876764AB8FDD
NEXT_PUBLIC_TOKEN_ADDRESS=0x9C04995284E6015fF45068dc78f6Dd8263581dF9
NEXT_PUBLIC_IMPLEMENTATION_ADDRESS=0xc08fC6540990807a04F04e2cefDb9d4aA6024c5C
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/[your-query-url]/crowd-funding/version/latest
NEXT_PUBLIC_ARWEAVE_GATEWAY=https://arweave.net
NEXT_PUBLIC_BLOCK_EXPLORER=https://testnet.bscscan.com
```

## Key Features to Implement

### Phase 1: Core Functionality
- [ ] Wallet connection (RainbowKit)
- [ ] Browse campaigns (GraphQL)
- [ ] View campaign details
- [ ] Make donations
- [ ] Create campaigns
- [ ] View user dashboard

### Phase 2: Milestone & Voting
- [ ] Create milestones
- [ ] Vote on milestones
- [ ] View milestone details
- [ ] Milestone timeline visualization
- [ ] Vote weight calculation display

### Phase 3: Advanced Features
- [ ] Withdraw donations (with penalty calculation)
- [ ] Withdraw milestone funds
- [ ] End campaign early
- [ ] Token balance & history
- [ ] Search & filters
- [ ] Category pages

### Phase 4: Polish
- [ ] Admin dashboard
- [ ] Platform statistics
- [ ] User profiles
- [ ] Activity feeds
- [ ] Mobile optimization
- [ ] Error boundaries
- [ ] Loading skeletons

## Testing Guidelines

### Unit Tests
- Test utility functions
- Test component logic
- Mock blockchain data

### Integration Tests
- Test user flows
- Test contract interactions
- Test GraphQL queries

### E2E Tests
- Critical user journeys
- Wallet connection flow
- Transaction flows

## Performance Optimization

- Use Next.js Image component
- Lazy load components
- Paginate long lists
- Cache GraphQL queries
- Optimize bundle size
- Use React.memo for expensive components

## Security Considerations

- Validate all inputs
- Sanitize user content
- Never store private keys
- Use secure RPC endpoints
- Verify contract addresses
- Handle wallet disconnection
- Rate limit if needed

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Development Workflow

1. Create feature branch from `main`
2. Implement feature following conventions
3. Test locally with BSC Testnet
4. Create pull request
5. Code review
6. Merge to main
7. Deploy to staging/production

## Useful Resources

- BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart
- BSCScan Testnet: https://testnet.bscscan.com
- The Graph Studio: https://thegraph.com/studio
- Arweave Docs: https://docs.arweave.org
- RainbowKit Docs: https://www.rainbowkit.com
- wagmi Docs: https://wagmi.sh

---

**When implementing features, always:**
1. Check contract ABIs for exact function signatures
2. Query subgraph for data before writing custom logic
3. Handle loading, error, and success states
4. Test with real wallet on BSC Testnet
5. Consider mobile users
6. Add proper TypeScript types
7. Follow existing code patterns
8. Write clear commit messages
