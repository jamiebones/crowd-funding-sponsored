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

### Frontend
- **Next.js 16.0.7** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **RainbowKit** - Wallet connection
- **wagmi/viem** - Ethereum interactions
- **Apollo Client** - GraphQL client
- **Arweave** - Decentralized storage for content
- **Web3Auth** - Account abstraction & social login (Planned)
- **Stripe** - Fiat payment processing (Planned)

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

---

## AGENT RESTRICTIONS

**CRITICAL: Agents are NOT allowed to:**
- Read, view, or access ANY `.env`, `.env.local`, `.env.production`, or environment variable files
- Display environment variable values in responses
- Suggest viewing environment files without explicit user permission
- Make assumptions about environment variable values

---

## COMPREHENSIVE PLAN: Social Login + Wallet Abstraction + Fiat Payments

### Overview
Integration of social authentication, account abstraction via Web3Auth, and fiat payment processing through Stripe to enable seamless onboarding for non-crypto users while maintaining non-custodial principles.

### Branch Setup
```bash
git checkout main
git pull origin main
git checkout -b feature/social-login-wallet-abstraction
```

---

## Phase 1: Account Abstraction with Web3Auth (Priority: HIGH)

### 1.1 Setup & Installation
- [x] Install dependencies: `pnpm add @web3auth/modal @web3auth/ethereum-provider @web3auth/base`
- [ ] Create Web3Auth project at https://dashboard.web3auth.io
- [ ] Add Web3Auth Client ID to environment variables (request from user)
- [x] Configure OAuth providers (Google, Apple, Email)

### 1.2 Authentication Context
- [x] Create `lib/auth/web3auth-config.ts` with Web3Auth initialization
- [x] Create `context/authContext.tsx` to manage auth state
- [x] Implement dual wallet mode: `'web3' | 'social'`
- [x] Add auth provider to `components/providers.tsx`

### 1.3 Login UI Components
- [ ] Create `components/auth/LoginModal.tsx` with two tabs:
  - Tab 1: "Connect Wallet" (existing RainbowKit)
  - Tab 2: "Sign in with Email/Social" (Web3Auth)
- [ ] Add social provider buttons (Google, Apple, Email)
- [ ] Update `components/Navbar.tsx` with new login button
- [ ] Handle wallet switching between modes

### 1.4 Wallet Integration Layer
- [x] Create `lib/wallet-provider.ts` to abstract wallet operations
- [x] Implement `getWalletClient()` that returns wagmi client or Web3Auth signer
- [ ] Modify existing contract interaction hooks to use abstraction layer
- [ ] Add wallet export feature for Web3Auth users

**Files to Create:**
```
apps/frontend/
├── lib/
│   ├── auth/
│   │   ├── web3auth-config.ts
│   │   └── wallet-provider.ts
├── context/
│   └── authContext.tsx
├── components/
│   └── auth/
│       ├── LoginModal.tsx
│       ├── SocialLoginButton.tsx
│       └── WalletExport.tsx
```

---

## Phase 2: Backend User Management (Priority: HIGH)

### 2.1 Database Schema
- [ ] Create MongoDB collections:
  - `users`: `{ id, email, provider, web3AuthId, walletAddress, createdAt, emailVerified }`
  - `sessions`: `{ userId, token, expiresAt, createdAt }`
  - `paymentMethods`: `{ userId, stripeCustomerId, last4, brand, default }`

### 2.2 API Routes
- [ ] Create `app/api/auth/web3auth/callback/route.ts` for Web3Auth redirect
- [ ] Create `app/api/users/profile/route.ts` (GET user profile)
- [ ] Create `app/api/users/wallet/route.ts` (GET wallet address for user)
- [ ] Add authentication middleware for protected routes

### 2.3 Session Management
- [ ] Implement JWT-based sessions with httpOnly cookies
- [ ] Add session refresh logic
- [ ] Handle logout across Web3Auth and traditional wallets

**Files to Create:**
```
apps/frontend/
├── app/api/
│   ├── auth/
│   │   └── web3auth/
│   │       └── callback/
│   │           └── route.ts
│   └── users/
│       ├── profile/
│       │   └── route.ts
│       └── wallet/
│           └── route.ts
├── lib/
│   ├── db/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   └── Session.ts
│   │   └── mongodb.ts
│   └── middleware/
│       └── auth.ts
```

---

## Phase 3: Stripe Fiat Payment Integration (Priority: MEDIUM)

### 3.1 Stripe Setup
- [ ] Install dependencies: `pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js`
- [ ] Create Stripe account and get API keys
- [ ] Add Stripe keys to environment variables (server-side only)
- [ ] Configure webhook endpoint in Stripe dashboard

### 3.2 Payment Flow API
- [ ] Create `app/api/stripe/create-checkout/route.ts`:
  - Accept: `{ campaignId, amountUSD, userId }`
  - Return: Stripe checkout session URL
- [ ] Create `app/api/stripe/webhook/route.ts`:
  - Handle `checkout.session.completed` event
  - Store payment record in database
  - Trigger crypto purchase flow

### 3.3 Crypto On-Ramp Integration
- [ ] Research options: MoonPay API, Transak API, or manual DEX swap
- [ ] Implement `lib/crypto/purchase-bnb.ts`:
  - Input: USD amount from Stripe webhook
  - Output: BNB sent to user's Web3Auth wallet
- [ ] Add retry logic and error handling

### 3.4 Auto-Donation Execution
- [ ] Create `app/api/donations/auto-execute/route.ts`:
  - Triggered after BNB purchase completes
  - Uses user's Web3Auth wallet to sign donation transaction
  - Updates campaign via smart contract
  - Sends confirmation email

### 3.5 Payment UI Components
- [ ] Update `app/projects/[address]/donate/page.tsx`:
  - Add payment method selector: "Pay with Crypto" | "Pay with Card"
  - Create `components/payment/StripeCheckout.tsx`
  - Add loading states: "Processing payment..." → "Purchasing BNB..." → "Donating..."
- [ ] Create `components/payment/PaymentMethodManager.tsx` for dashboard

**Files to Create:**
```
apps/frontend/
├── app/api/
│   ├── stripe/
│   │   ├── create-checkout/
│   │   │   └── route.ts
│   │   └── webhook/
│   │       └── route.ts
│   └── donations/
│       └── auto-execute/
│           └── route.ts
├── lib/
│   └── crypto/
│       └── purchase-bnb.ts
├── components/
│   └── payment/
│       ├── StripeCheckout.tsx
│       ├── PaymentMethodSelector.tsx
│       └── PaymentMethodManager.tsx
```

---

## Phase 4: Enhanced Dashboard (Priority: LOW)

### 4.1 Dashboard Extensions
- [ ] Add "Payment Methods" tab to `app/dashboard/page.tsx`
- [ ] Show linked social accounts
- [ ] Display Web3Auth wallet address with "Export Wallet" button
- [ ] List saved credit cards (Stripe payment methods)
- [ ] Add fiat payment history table

### 4.2 Wallet Management
- [ ] Create `components/dashboard/WalletInfo.tsx`:
  - Show wallet type (Web3 or Social)
  - Display address with copy button
  - Add "Export Private Key" for Web3Auth (with password protection)
- [ ] Create `components/dashboard/PaymentHistory.tsx`:
  - Show both crypto donations and fiat payments
  - Link to transaction on block explorer
  - Display Stripe receipt links

**Files to Create:**
```
apps/frontend/
├── components/
│   └── dashboard/
│       ├── WalletInfo.tsx
│       ├── PaymentHistory.tsx
│       └── PaymentMethods.tsx
```

---

## Phase 5: Security & Compliance (Priority: HIGH)

### 5.1 Security Measures
- [ ] Implement rate limiting on sensitive endpoints (1 req/sec per IP)
- [ ] Add CSRF protection for state-changing operations
- [ ] Validate all user inputs (email format, amounts, addresses)
- [ ] Sanitize user-generated content
- [ ] Add Content Security Policy headers

### 5.2 Email Verification
- [ ] Send verification email on signup (use existing nodemailer setup)
- [ ] Create `app/api/auth/verify-email/[token]/route.ts`
- [ ] Require verification before wallet activation
- [ ] Add "Resend verification" option

### 5.3 Audit Logging
- [ ] Create `auditLogs` MongoDB collection
- [ ] Log all sensitive operations:
  - User login/logout
  - Wallet exports
  - Fiat payments
  - Large donations (>$1000)
- [ ] Add admin view for audit logs

### 5.4 Compliance
- [ ] Add Terms of Service page (`/terms`)
- [ ] Add Privacy Policy page (`/privacy`)
- [ ] Create custodial wallet disclaimer modal
- [ ] Add KYC/AML notice for large transactions

**Files to Create:**
```
apps/frontend/
├── app/
│   ├── terms/
│   │   └── page.tsx
│   └── privacy/
│       └── page.tsx
├── app/api/
│   └── auth/
│       └── verify-email/
│           └── [token]/
│               └── route.ts
├── lib/
│   ├── security/
│   │   ├── rate-limit.ts
│   │   └── csrf.ts
│   └── audit/
│       └── logger.ts
```

---

## Phase 6: Testing & Optimization (Priority: MEDIUM)

### 6.1 Unit Tests
- [ ] Test Web3Auth initialization
- [ ] Test wallet provider abstraction
- [ ] Test Stripe webhook handler
- [ ] Test payment flow logic

### 6.2 Integration Tests
- [ ] Test complete social login flow
- [ ] Test fiat-to-donation flow end-to-end
- [ ] Test wallet export functionality
- [ ] Test payment history retrieval

### 6.3 Performance
- [ ] Add caching for user profiles (Redis or in-memory)
- [ ] Optimize GraphQL queries
- [ ] Implement pagination for payment history
- [ ] Add loading skeletons for async operations

---

## Environment Variables Required

**Note: Request these from the user when needed. Never view env files directly.**

```bash
# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=<request_from_user>
WEB3AUTH_VERIFIER_NAME=<request_from_user>

# Stripe
STRIPE_SECRET_KEY=<request_from_user>
STRIPE_WEBHOOK_SECRET=<request_from_user>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<request_from_user>

# Crypto On-Ramp (choose one)
MOONPAY_API_KEY=<request_from_user>
# OR
TRANSAK_API_KEY=<request_from_user>

# Security
JWT_SECRET=<request_from_user>
CSRF_SECRET=<request_from_user>
```

---

## Implementation Timeline

### Pre-Development (Week 0)
- [ ] Create feature branch: `git checkout -b feature/social-login-wallet-abstraction`
- [ ] Update package.json with new dependencies
- [ ] Set up Web3Auth dashboard account
- [ ] Set up Stripe account
- [ ] Choose crypto on-ramp provider (MoonPay vs Transak)

### Phase 1: Web3Auth (Week 1-2)
- [ ] Install Web3Auth packages
- [ ] Create auth configuration
- [ ] Build login modal UI
- [ ] Integrate with existing wallet system
- [ ] Test social login flow
- [ ] Deploy to staging for testing

### Phase 2: Backend (Week 2-3)
- [ ] Create MongoDB schemas
- [ ] Build API routes for user management
- [ ] Implement session management
- [ ] Add authentication middleware
- [ ] Test with Postman/Insomnia

### Phase 3: Stripe (Week 3-4)
- [ ] Install Stripe packages
- [ ] Create checkout flow
- [ ] Implement webhook handler
- [ ] Integrate crypto on-ramp
- [ ] Build auto-donation executor
- [ ] Test with Stripe test cards

### Phase 4: Dashboard (Week 4)
- [ ] Add payment methods tab
- [ ] Build wallet info component
- [ ] Create payment history view
- [ ] Add wallet export feature

### Phase 5: Security (Week 5)
- [ ] Add rate limiting
- [ ] Implement email verification
- [ ] Create audit logging
- [ ] Add legal pages (T&C, Privacy)
- [ ] Security audit

### Phase 6: Testing (Week 6)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Bug fixes

### Deployment
- [ ] Update production environment variables
- [ ] Deploy to Vercel
- [ ] Configure Stripe webhook URL
- [ ] Monitor error logs
- [ ] Gradual rollout (10% → 50% → 100%)

---

## Success Metrics

- [ ] 90%+ onboarding success rate (vs current ~30% with Web3 only)
- [ ] <30 seconds from landing to first donation (with social login)
- [ ] Support 3+ social providers (Google, Apple, Email)
- [ ] Process fiat payments with <5% failure rate
- [ ] Zero security incidents in first 3 months
- [ ] User satisfaction score >4.5/5 for new flow

---

## Risk Mitigation

1. **Web3Auth Downtime**: Implement fallback to traditional Web3 wallet only mode
2. **Stripe Payment Failures**: Add manual retry option and customer support contact
3. **Crypto On-Ramp Delays**: Set clear expectations (5-15 min processing time)
4. **Security Breach**: Regular penetration testing, bug bounty program
5. **Regulatory Changes**: Monitor fintech compliance requirements, legal consultation

---

## Architecture Decision: Account Abstraction (Non-Custodial)

### Why Web3Auth?

**Industry Standard**: Web3Auth is the recommended approach for consumer-facing Web3 apps in 2025.

**Key Advantages:**
- **Non-Custodial**: Keys are user-controlled via MPC/threshold cryptography, not stored on our servers
- **Regulatory Position**: Not a custodian, avoids money transmitter licenses
- **UX**: 90%+ onboarding success rate with email/social login
- **Security**: No central private key database for hackers to target
- **Recovery**: Social recovery prevents permanent loss of funds
- **Proven**: Used by StepN, Cyber Connect, Farcaster (2M+ monthly active wallets)

**How It Works:**
```
User logs in with Google →
  Web3Auth splits private key into 3 shares via MPC:
    1. User's device (browser storage)
    2. Web3Auth server
    3. Backup (Google Drive/iCloud)
  
To sign transaction:
  - Reconstructs key from 2 of 3 shares
  - User never sees raw private key
  - Platform has zero access to keys
```

**Alternatives Considered:**
- **Pure Custodial**: Rejected due to regulatory burden, security liability
- **Traditional Web3 Only**: Low onboarding success, poor UX for non-crypto users
- **Other AA Solutions**: Privy ($99/mo), Dynamic (similar), Web3Auth chosen for cost and features

---

## Dependencies to Install

```json
{
  "dependencies": {
    "@web3auth/modal": "^8.0.0",
    "@web3auth/ethereum-provider": "^8.0.0",
    "@web3auth/base": "^8.0.0",
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0",
    "jose": "^5.0.0"
  }
}
```

---

**This plan implements industry-standard Web3Auth account abstraction + Stripe payments while maintaining non-custodial principles and providing seamless UX for non-crypto users.**
