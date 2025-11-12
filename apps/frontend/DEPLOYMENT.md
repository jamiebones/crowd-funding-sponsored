# Production Deployment Checklist

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] All TODO comments addressed or documented
- [ ] Code follows established patterns
- [ ] No hard-coded values (use environment variables)

### Testing
- [ ] All manual user flows tested (see TESTING.md)
- [ ] Accessibility audit passed (Lighthouse > 95)
- [ ] Performance audit passed (Lighthouse > 90)
- [ ] Cross-browser testing completed
- [ ] Mobile testing on real devices
- [ ] Error boundaries tested
- [ ] Loading skeletons verified
- [ ] All forms validated

### Security
- [ ] Environment variables configured
- [ ] Private keys never committed
- [ ] API endpoints secured
- [ ] Input validation on all forms
- [ ] XSS prevention verified
- [ ] CORS configured correctly
- [ ] Rate limiting considered (if needed)

### Smart Contracts
- [ ] Contracts deployed to mainnet (or testnet)
- [ ] Contract addresses updated in constants
- [ ] ABIs updated and committed
- [ ] Subgraph deployed and synced
- [ ] GraphQL endpoint configured

### Configuration
- [ ] `.env.local` example provided
- [ ] All required environment variables documented
- [ ] Chain ID verified (97 for testnet, 56 for mainnet)
- [ ] RPC endpoints configured
- [ ] Arweave gateway URL set
- [ ] Block explorer URL set
- [ ] Subgraph URL set

### Dependencies
- [ ] All dependencies up to date
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Package-lock.json committed
- [ ] Unused dependencies removed

### Build
- [ ] `npm run build` succeeds without errors
- [ ] Build warnings reviewed and addressed
- [ ] Bundle size checked (< 200KB gzipped target)
- [ ] Source maps configured for production

### Assets
- [ ] All images optimized
- [ ] Arweave wallet funded (for uploads)
- [ ] Platform fee set in factory contract
- [ ] MongoDB database configured (for emails)
- [ ] Email service configured (Gmail SMTP)

## Environment Variables

### Required Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_CHAIN_ID=97 # or 56 for mainnet
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_IMPLEMENTATION_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../crowd-funding/version/latest
NEXT_PUBLIC_ARWEAVE_GATEWAY=https://arweave.net
NEXT_PUBLIC_BLOCK_EXPLORER=https://testnet.bscscan.com # or https://bscscan.com for mainnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Server-side only (no NEXT_PUBLIC prefix)
MONGODB_URI=mongodb+srv://...
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
TURBO_ARWEAVE_WALLET_JSON={"...":"..."}
```

### Verify Variables
- [ ] All NEXT_PUBLIC_ variables accessible in browser
- [ ] Private variables not exposed to client
- [ ] MongoDB URI valid and database accessible
- [ ] Gmail credentials working
- [ ] Arweave wallet has balance

## Deployment Steps

### 1. Build & Test Locally
```bash
# Install dependencies
pnpm install

# Run build
pnpm run build

# Test production build locally
pnpm start

# Open http://localhost:3000
# Test all critical flows
```

### 2. Deploy Frontend (Vercel Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Settings → Environment Variables
```

### 3. Configure DNS (if custom domain)
- [ ] Add domain in Vercel
- [ ] Update DNS records (A or CNAME)
- [ ] Verify SSL certificate issued
- [ ] Test HTTPS access

### 4. Deploy Subgraph (The Graph Studio)
```bash
cd apps/subgraph/crowd-funding

# Authenticate
graph auth --studio <DEPLOY_KEY>

# Deploy
graph deploy --studio crowd-funding

# Wait for sync
# Verify queries work
```

### 5. Configure Services

#### MongoDB Atlas
- [ ] Database created
- [ ] User credentials set
- [ ] Network access configured (allow Vercel IPs or 0.0.0.0/0)
- [ ] Connection string tested

#### Gmail SMTP
- [ ] 2FA enabled on Gmail account
- [ ] App password generated
- [ ] Test email sending

#### Arweave
- [ ] Wallet has sufficient AR balance
- [ ] Test upload functionality
- [ ] Monitor balance

## Post-Deployment Verification

### Smoke Tests
- [ ] Homepage loads
- [ ] Wallet connection works
- [ ] Browse campaigns
- [ ] View campaign details
- [ ] Create campaign (end-to-end)
- [ ] Make donation (end-to-end)
- [ ] Dashboard accessible
- [ ] Admin dashboard (if owner)

### Monitoring
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics configured (e.g., Google Analytics)
- [ ] Uptime monitoring (e.g., UptimeRobot)
- [ ] Log aggregation (Vercel logs or external)

### Performance
- [ ] Run Lighthouse on production URL
- [ ] Check Core Web Vitals in Google Search Console
- [ ] Test on slow 3G network
- [ ] Verify loading skeletons appear

### Accessibility
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify ARIA labels
- [ ] Check color contrast
- [ ] Test at 200% zoom

### Security
- [ ] Check headers (CSP, X-Frame-Options, etc.)
- [ ] Verify HTTPS enforced
- [ ] Test input sanitization
- [ ] Review error messages (no sensitive info)

## Rollback Plan

### If Critical Issues Arise
1. **Immediate**: Revert to previous deployment in Vercel
2. **Identify**: Check error logs, user reports
3. **Fix**: Address issue in development
4. **Test**: Full testing cycle
5. **Redeploy**: With fix verified

### Rollback Commands
```bash
# Vercel
vercel rollback

# The Graph (redeploy previous version)
graph deploy --studio crowd-funding --version-label v1.0.0
```

## Monitoring & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review analytics for anomalies

### Weekly
- [ ] Review performance metrics
- [ ] Check Core Web Vitals
- [ ] Monitor subgraph sync status
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Security audit (`npm audit`)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit
- [ ] Review and optimize bundle size
- [ ] Database backup verification

### Quarterly
- [ ] Comprehensive security review
- [ ] User testing session
- [ ] Feature prioritization review
- [ ] Infrastructure cost optimization

## Documentation

### User Documentation
- [ ] How to create a campaign
- [ ] How to donate
- [ ] How to vote on milestones
- [ ] How to withdraw funds
- [ ] FAQ updated

### Developer Documentation
- [ ] README.md up to date
- [ ] API documentation current
- [ ] Architecture diagrams
- [ ] Deployment guide
- [ ] Troubleshooting guide

## Support

### Communication Channels
- [ ] User support email/form
- [ ] Community Discord/Telegram (if applicable)
- [ ] Status page for incidents
- [ ] Bug reporting process

### Incident Response
1. **Detect**: Monitor alerts
2. **Triage**: Assess severity
3. **Communicate**: Notify users if needed
4. **Fix**: Deploy hotfix or rollback
5. **Post-Mortem**: Document and improve

## Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy (if using cookies)
- [ ] GDPR compliance (if EU users)
- [ ] Smart contract audited (recommended for mainnet)

## Success Metrics

### Technical KPIs
- Uptime: > 99.9%
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Error rate: < 1%

### Business KPIs
- Total campaigns created
- Total funds raised
- Active users (daily/monthly)
- Conversion rate (visitors → donors)
- Average donation amount

## Launch Announcement

- [ ] Blog post/article
- [ ] Social media posts
- [ ] Community announcement
- [ ] Press release (if applicable)
- [ ] Demo video

## Checklist Summary

**Total Items**: ~100+

**Categories**:
- Code Quality: 6 items
- Testing: 8 items
- Security: 7 items
- Smart Contracts: 4 items
- Configuration: 6 items
- Dependencies: 4 items
- Build: 4 items
- Assets: 4 items
- Environment Variables: 9 items
- Deployment: 15 items
- Post-Deployment: 15 items
- Monitoring: 12 items
- Documentation: 5 items
- Legal: 5 items

**Estimated Time**:
- Initial Deployment: 4-6 hours
- Testing & Verification: 2-3 hours
- Documentation: 1-2 hours
- **Total**: 7-11 hours

---

**Remember**: It's better to delay deployment and fix issues than to rush and break things in production.

**Status**: Ready when all checkboxes are complete ✅

**Good luck with your deployment!** 🚀
