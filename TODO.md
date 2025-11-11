# Frontend Development - Page-by-Page TODO List

## Setup & Configuration
- [x] Initialize Next.js 15+ project in `apps/frontend`
- [x] Install dependencies (RainbowKit, wagmi, viem, Apollo Client, TailwindCSS)
- [x] Setup environment variables
- [x] Configure RainbowKit with BSC Testnet
- [x] Setup Apollo Client with subgraph endpoint
- [x] Create contract ABIs in `abis/` directory
- [x] Setup TailwindCSS theme (colors, fonts, spacing)
- [x] Create base layout component with Providers
- [x] Setup wallet connection context (via RainbowKit)
- [x] Configure TypeScript strict mode

---

## Phase 1: Public Pages (No Wallet Required)

### Page 1: Landing/Home (`/`) ✅ COMPLETE
- [x] Create responsive hero section with value proposition
- [x] Build platform statistics component (query from subgraph `Statistic` entity)
- [x] Create featured campaigns section (top 6-8 by `amountRaised` or `backers`)
- [x] Build category showcase grid (all 9 categories with icons)
- [x] Create "How It Works" section (3-4 steps)
- [x] Add CTA buttons ("Browse Projects", "Start Campaign")
- [x] Build responsive navigation header
- [x] Create footer with links
- [x] Test mobile responsiveness
- [x] Add loading skeletons

### Page 2: Explore/Browse Campaigns (`/projects`) ✅ COMPLETE
- [x] Setup Apollo query for campaigns with pagination
- [x] Create campaign card component (grid variant)
- [x] Create campaign card component (list variant)
- [x] Build grid/list view toggle
- [x] Implement category filter dropdown
- [x] Implement status filter (Active, Ended, Funded)
- [x] Implement progress filter (0-25%, 25-50%, etc.)
- [x] Build sort dropdown (Newest, Ending Soon, Most Funded, Most Backers)
- [x] Implement full-text search input (using subgraph `campaignSearch`)
- [x] Build pagination component
- [x] Add "No results" state
- [x] Test all filter combinations
- [x] Optimize query performance

### Page 3: Campaign Detail (`/projects/[address]`) ✅ COMPLETE
- [x] Create dynamic route `[address].tsx`
- [x] Query campaign data from subgraph
- [x] Query campaign content from Arweave (using `campaignCID`)
- [x] Build campaign header component
- [x] Create media gallery component (images/videos)
- [x] Build funding progress card (goal, raised, backers, time remaining)
- [x] Create milestone timeline component (all milestones with status)
- [x] Build recent donations list component
- [x] Display campaign owner info
- [x] Add "Donate" CTA button (prominent)
- [x] Build share buttons (Twitter, Facebook, Copy Link)
- [x] Add breadcrumb navigation
- [x] Handle campaign not found (404)
- [x] Test with ended campaigns
- [x] Test with overfunded campaigns

### Page 4: Search Results (`/search`) ✅ COMPLETE
- [x] Create search results page
- [x] Query campaigns with search parameter
- [x] Display search query in header
- [x] Show results count
- [x] Reuse filter components from Explore page
- [x] Highlight matching text in results
- [x] Add "Back to Explore" link
- [x] Handle empty search query
- [x] Handle no results state

### Page 5: About/How It Works (`/about`)
- [ ] Create "For Campaign Creators" section
- [ ] Create "For Donors" section
- [ ] Build milestone-based funding explanation with visuals
- [ ] Create token rewards system explanation
- [ ] Build voting mechanism explanation with examples
- [ ] Display fee structure table
- [ ] Create FAQ accordion component
- [ ] Add contact/support information
- [ ] Make fully responsive

---

## Phase 2: Wallet-Connected Pages (Core Functionality)

### Page 6: Create Campaign (`/new-project`)
- [ ] Add wallet connection check (redirect if not connected)
- [ ] Build multi-step form layout
- [ ] **Step 1: Basic Info**
  - [ ] Title input with validation
  - [ ] Category dropdown
  - [ ] Goal amount input (ETH, minimum 0.01)
  - [ ] Duration input (days, 1-365)
  - [ ] Form validation
- [ ] **Step 2: Campaign Details**
  - [ ] Description rich text editor
  - [ ] Media upload component (images/videos)
  - [ ] Upload to Arweave function
  - [ ] Preview uploaded media
  - [ ] Upload progress indicator
- [ ] **Step 3: Review & Submit**
  - [ ] Display all entered data
  - [ ] Show funding fee (0.000000001 ETH)
  - [ ] Calculate total cost (fee)
  - [ ] Edit buttons to go back
- [ ] Build Arweave upload utility function
- [ ] Integrate `createNewCrowdFundingContract` contract function
- [ ] Add transaction pending state
- [ ] Show transaction success modal with campaign link
- [ ] Handle transaction errors
- [ ] Test full flow with testnet

### Page 7: User Dashboard (`/dashboard`)
- [ ] Create dashboard layout with tabs
- [ ] **My Campaigns Tab:**
  - [ ] Query user's campaigns (`getCampaignsByOwner` or subgraph)
  - [ ] Display campaign cards with quick stats
  - [ ] Add quick action buttons (View, Manage, Create Milestone)
  - [ ] Show campaign status badges
- [ ] **My Donations Tab:**
  - [ ] Query donations by user address from subgraph
  - [ ] Display campaigns donated to
  - [ ] Show amount donated per campaign
  - [ ] Show tokens earned (MWG-DT balance from donations)
  - [ ] Add "Withdraw" button (if eligible)
  - [ ] Show withdrawal eligibility status
- [ ] **My Votes Tab:**
  - [ ] Query votes by user from subgraph
  - [ ] Display milestones voted on
  - [ ] Show vote direction (Support/Against)
  - [ ] Show vote weight
  - [ ] Display milestone current status
- [ ] **My Tokens Tab:**
  - [ ] Query token balance from contract
  - [ ] Display total MWG-DT balance
  - [ ] Show token transaction history
  - [ ] Add token info tooltip
- [ ] **Activity Feed:**
  - [ ] Aggregate recent user actions
  - [ ] Display chronologically
  - [ ] Add action type icons
  - [ ] Link to relevant pages
- [ ] Add empty states for each tab
- [ ] Test with various user scenarios

### Page 8: Donation Flow (`/projects/[address]/donate`)
- [ ] Create donation modal/page
- [ ] Display campaign summary card
- [ ] Build donation amount input with validation
- [ ] Show token reward preview (1:1 ratio calculation)
- [ ] Display transaction cost preview
- [ ] Add balance check
- [ ] Integrate `giveDonationToCause` contract function
- [ ] Show transaction pending state
- [ ] Build success modal:
  - [ ] Receipt details
  - [ ] Tokens earned display
  - [ ] Share buttons
  - [ ] "View Campaign" button
- [ ] Handle insufficient balance error
- [ ] Handle campaign ended error
- [ ] Test various donation amounts
- [ ] Test transaction rejection

---

## Phase 3: Campaign Management & Milestones

### Page 9: Campaign Management (`/projects/[address]/manage`)
- [ ] Add ownership verification (only campaign owner can access)
- [ ] Query campaign data from subgraph
- [ ] Build campaign statistics dashboard:
  - [ ] Total raised
  - [ ] Number of backers
  - [ ] Time remaining
  - [ ] Milestone progress
- [ ] Create donor list table:
  - [ ] Donor addresses
  - [ ] Amounts donated
  - [ ] Timestamp
  - [ ] Sortable columns
- [ ] Add "Create New Milestone" button (disabled if pending milestone exists)
- [ ] Display current milestone status
- [ ] Add "Withdraw Milestone Funds" button (with eligibility check)
- [ ] Add "End Campaign Early" button with confirmation modal
- [ ] Show withdrawal history
- [ ] Test owner-only access
- [ ] Test all button states

### Page 10: Create Milestone (`/projects/[address]/milestone/new`)
- [ ] Verify campaign ownership
- [ ] Check for pending milestone (block if exists)
- [ ] Check withdrawal count (max 3)
- [ ] Build milestone form:
  - [ ] Title input
  - [ ] Description rich text editor
  - [ ] Media upload component
  - [ ] Upload to Arweave
- [ ] Show auto-set voting period (14 days)
- [ ] Build preview section
- [ ] Integrate `createNewMilestone` contract function
- [ ] Handle Arweave upload
- [ ] Show transaction pending state
- [ ] Redirect to milestone detail on success
- [ ] Handle max milestone error
- [ ] Handle pending milestone error

### Page 11: Milestone Detail (`/projects/[address]/milestone/[id]`)
- [ ] Create dynamic route for milestone ID
- [ ] Query milestone data from subgraph
- [ ] Fetch milestone content from Arweave (using `milestoneCID`)
- [ ] Display milestone media gallery
- [ ] Show milestone description
- [ ] Build status badge component (Pending, Approved, Declined)
- [ ] Create voting period countdown timer
- [ ] Display vote tallies (support vs against)
- [ ] Show vote percentage bars
- [ ] Build voter list component:
  - [ ] Voter addresses
  - [ ] Vote direction
  - [ ] Vote weight
- [ ] Add vote button (check eligibility: must be donor, voting period active)
- [ ] Disable vote button if already voted
- [ ] Show user's vote if already voted
- [ ] Add campaign context breadcrumb
- [ ] Handle milestone not found
- [ ] Test all milestone statuses

### Page 12: Vote on Milestone (Modal/Page)
- [ ] Verify user is a donor to the campaign
- [ ] Check if voting period is active
- [ ] Check if user already voted
- [ ] Display milestone summary
- [ ] Create vote option buttons (Support/Against)
- [ ] Show user's vote weight (based on donation amount)
- [ ] Display current vote tallies
- [ ] Show time remaining to vote
- [ ] Integrate `voteOnMilestone` contract function
- [ ] Build confirmation modal
- [ ] Show transaction pending state
- [ ] Update UI on success
- [ ] Handle already voted error
- [ ] Handle voting period ended error
- [ ] Handle not a donor error

---

## Phase 4: Advanced Features

### Page 13: Withdraw Donation Flow
- [ ] Add to My Donations tab or campaign detail page
- [ ] Check withdrawal eligibility (approved milestones < 3)
- [ ] Calculate withdrawal amount based on milestones:
  - [ ] 0 milestones: 100% - 10% tax
  - [ ] 1 milestone: 66.67% - 10% tax
  - [ ] 2 milestones: 33.33% - 10% tax
- [ ] Display withdrawal breakdown:
  - [ ] Original donation
  - [ ] Withdrawable amount (before tax)
  - [ ] Tax amount (10%)
  - [ ] Final amount
  - [ ] Tokens to be burned
- [ ] Add confirmation modal with clear warnings
- [ ] Integrate `retrieveDonatedAmount` contract function
- [ ] Show transaction pending state
- [ ] Update UI on success
- [ ] Handle max withdrawal error
- [ ] Test all milestone scenarios

### Page 14: Withdraw Milestone Funds
- [ ] Add to Campaign Management page
- [ ] Check eligibility:
  - [ ] Campaign must be ended
  - [ ] Withdrawal count < 3
  - [ ] Voting period must have elapsed (if applicable)
- [ ] Calculate withdrawal amount:
  - [ ] 1st milestone: 1/3 of balance (auto-approved)
  - [ ] 2nd/3rd milestone: 1/3 of balance (requires vote approval)
- [ ] Show withdrawal calculation
- [ ] Display vote results (if applicable)
- [ ] Add confirmation modal
- [ ] Integrate `withdrawMilestone` contract function
- [ ] Show transaction pending state
- [ ] Update campaign balance display
- [ ] Handle voting period not elapsed error
- [ ] Handle milestone declined error

### Page 15: End Campaign Early
- [ ] Add button to Campaign Management page
- [ ] Check if campaign is still running
- [ ] Check if funding goal was met
- [ ] Build confirmation modal with warnings:
  - [ ] Cannot undo
  - [ ] Must meet funding goal
  - [ ] Donors can withdraw if goal not met
- [ ] Integrate `endCampaign` contract function
- [ ] Show transaction pending state
- [ ] Update campaign status
- [ ] Redirect to campaign detail
- [ ] Handle goal not met error
- [ ] Handle already ended error

### Page 16: Token Balance & History
- [ ] Expand "My Tokens" tab in dashboard
- [ ] Query token balance from contract
- [ ] Build token transfer history component:
  - [ ] Mint events (from donations)
  - [ ] Burn events (from withdrawals)
  - [ ] Timestamps
  - [ ] Amounts
- [ ] Show total earned vs current balance
- [ ] Add token info modal (what tokens are used for)
- [ ] Add export transaction history button
- [ ] Create token stats visualization

---

## Phase 5: Utility Pages

### Page 17: User Profile (`/user/[address]`)
- [ ] Create dynamic route for user address
- [ ] Query user data from subgraph (`CampaignCreator` and `Donor`)
- [ ] Display user address (with ENS if available)
- [ ] Show campaigns created count
- [ ] Calculate total funding raised across campaigns
- [ ] Calculate total donated amount
- [ ] Display public campaigns list
- [ ] Show join date (first campaign or donation timestamp)
- [ ] Add "View on Block Explorer" link
- [ ] Handle user not found
- [ ] Make shareable

### Page 18: Category Page (`/category/[categoryName]`)
- [ ] Create dynamic route for category
- [ ] Map category name to enum value
- [ ] Query campaigns filtered by category
- [ ] Display category name and description
- [ ] Show category icon/image
- [ ] Calculate category statistics:
  - [ ] Total campaigns
  - [ ] Total raised
  - [ ] Active campaigns
- [ ] Reuse campaign grid from Explore page
- [ ] Apply same filters/sort options
- [ ] Handle invalid category
- [ ] Add breadcrumb navigation

### Page 19: Statistics/Analytics (`/stats`)
- [ ] Query `Statistic` entity from subgraph
- [ ] Build platform statistics dashboard:
  - [ ] Total campaigns
  - [ ] Total funding requested
  - [ ] Total funding given
  - [ ] Total backers
  - [ ] Total withdrawals
- [ ] Create charts using Chart.js or Recharts:
  - [ ] Campaigns created over time (line chart)
  - [ ] Funding distribution by category (pie chart)
  - [ ] Active vs ended campaigns (bar chart)
  - [ ] Top funded campaigns (bar chart)
- [ ] Build category breakdown table
- [ ] Show trending data (most active week/month)
- [ ] Add date range filter
- [ ] Make responsive

### Page 20: Admin Dashboard (`/admin`)
- [ ] Verify connected wallet is factory owner
- [ ] Query factory contract for platform stats
- [ ] Display total fees collected
- [ ] Show all campaigns list (admin view)
- [ ] Build "Set Funding Fee" form:
  - [ ] Input with validation (max 1 ETH)
  - [ ] Current fee display
  - [ ] Integrate `setFundingFee` contract function
- [ ] Build "Withdraw Factory Funds" button:
  - [ ] Show available balance
  - [ ] Add confirmation modal
  - [ ] Integrate `withdrawFunds` contract function
- [ ] Display recent activity log
- [ ] Test owner-only access
- [ ] Handle unauthorized access

### Page 21: 404 Page
- [ ] Create custom 404 component
- [ ] Build "Campaign Not Found" variant
- [ ] Build "Page Not Found" variant
- [ ] Add "Connect Wallet" prompt if wallet needed
- [ ] Add "Go Home" button
- [ ] Add "Browse Campaigns" button
- [ ] Make visually appealing

### Page 22: Transaction Status (`/tx/[hash]`)
- [ ] Create dynamic route for transaction hash
- [ ] Build transaction tracker component
- [ ] Show pending spinner
- [ ] Display confirmation count
- [ ] Add block explorer link
- [ ] Show success/failure state
- [ ] Display next steps based on transaction type:
  - [ ] Campaign created → View campaign
  - [ ] Donation made → View campaign / My donations
  - [ ] Milestone created → View milestone
  - [ ] Vote cast → View milestone
- [ ] Add auto-redirect on success (optional)
- [ ] Handle invalid transaction hash

---

## Phase 6: Shared Components & Polish

### Core Components
- [ ] Campaign Card (grid & list variants)
- [ ] Milestone Timeline (horizontal & vertical)
- [ ] Progress Bar with stats
- [ ] Category Badge
- [ ] Status Badge (Active, Ended, Pending, Approved, Declined)
- [ ] Token Balance Display
- [ ] Wallet Connect Button
- [ ] Transaction Status Modal
- [ ] Loading Skeletons (campaign card, detail page, etc.)
- [ ] Empty States (no campaigns, no donations, etc.)
- [ ] Error Boundary Component

### Utility Functions
- [ ] Format Ether (with locale)
- [ ] Format Date/Timestamp
- [ ] Format Address (truncate with ENS support)
- [ ] Calculate Time Remaining
- [ ] Calculate Progress Percentage
- [ ] Get Category Name/Icon
- [ ] Get Status Color/Icon
- [ ] Validate Form Inputs
- [ ] Upload to Arweave
- [ ] Fetch from Arweave

### Global Features
- [ ] Toast notifications (success, error, info)
- [ ] Loading indicators (global & local)
- [ ] Error handling (global error boundary)
- [ ] Wallet connection modal
- [ ] Network switch prompt (if not BSC Testnet)
- [ ] Transaction confirmation modals
- [ ] Mobile navigation menu
- [ ] Search bar in header
- [ ] Dark mode toggle (optional)

### Optimization
- [ ] Lazy load images with Next.js Image
- [ ] Code split routes
- [ ] Paginate long lists
- [ ] Cache GraphQL queries
- [ ] Optimize bundle size
- [ ] Add React.memo to expensive components
- [ ] Prefetch critical data
- [ ] Implement ISR for static pages

### Testing
- [ ] Test wallet connection flow
- [ ] Test all transaction flows
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test with slow network
- [ ] Test error states
- [ ] Test with empty data
- [ ] Cross-browser testing
- [ ] Accessibility audit

### Documentation
- [ ] README with setup instructions
- [ ] Environment variables documentation
- [ ] Deployment guide
- [ ] User guide (how to use the platform)
- [ ] Developer guide (how to contribute)

---

## Development Order Recommendation

**Week 1-2: Foundation**
1. Setup & Configuration
2. Page 1: Landing/Home
3. Page 2: Explore/Browse
4. Page 3: Campaign Detail

**Week 3-4: Core Functionality**
5. Page 6: Create Campaign
6. Page 8: Donation Flow
7. Page 7: User Dashboard (My Campaigns, My Donations)

**Week 5-6: Milestones & Voting**
8. Page 9: Campaign Management
9. Page 10: Create Milestone
10. Page 11: Milestone Detail
11. Page 12: Vote on Milestone

**Week 7-8: Advanced Features**
12. Withdraw Donation Flow
13. Withdraw Milestone Funds
14. End Campaign Early
15. Token Balance & History

**Week 9: Utility & Polish**
16. Page 17: User Profile
17. Page 18: Category Page
18. Page 19: Statistics
19. Page 4: Search Results
20. Page 5: About

**Week 10: Admin & Final Polish**
21. Page 20: Admin Dashboard
22. Page 21: 404 Page
23. Page 22: Transaction Status
24. Shared Components refinement
25. Optimization & testing
26. Documentation

---

## Progress Tracking

Mark tasks as complete as you finish them. Update this file regularly to track progress.

**Current Phase:** Phase 1 - Public Pages  
**Pages Completed:** 4 / 22  
**Estimated Completion:** 10 weeks
