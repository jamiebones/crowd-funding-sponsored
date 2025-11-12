# Performance Optimization Guide

This guide outlines the performance optimizations implemented and best practices for maintaining optimal performance.

## Current Optimizations

### 1. Code Splitting & Lazy Loading

#### Next.js Automatic Code Splitting
- Each route is automatically code-split
- Components are only loaded when needed
- Reduces initial bundle size

#### Manual Lazy Loading
```tsx
import { lazyLoad } from '@/lib/performance';
import { CampaignCardSkeleton } from '@/components/LoadingSkeletons';

// Lazy load heavy components
const HeavyChart = lazyLoad(
  () => import('@/components/HeavyChart'),
  <CampaignCardSkeleton />
);
```

### 2. Loading Skeletons

#### Benefits
- Improves perceived performance
- Prevents layout shift
- Better user experience during loading

#### Usage
```tsx
import { CampaignCardSkeleton } from '@/components/LoadingSkeletons';

{loading ? (
  <CampaignCardSkeleton />
) : (
  <CampaignCard data={campaign} />
)}
```

### 3. GraphQL Query Optimization

#### Fetch Only Required Fields
```graphql
query GetCampaign($id: ID!) {
  campaign(id: $id) {
    id
    title
    # Only fetch what you need
  }
}
```

#### Pagination
```tsx
const { data } = useQuery(GET_CAMPAIGNS, {
  variables: {
    first: 12,
    skip: (page - 1) * 12,
  },
});
```

### 4. Input Optimization

#### Debouncing Search
```tsx
import { debounce } from '@/lib/performance';

const handleSearch = debounce((query: string) => {
  performSearch(query);
}, 300); // Wait 300ms after user stops typing
```

#### Throttling Scroll
```tsx
import { throttle } from '@/lib/performance';

const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100); // Execute at most every 100ms
```

### 5. Image Optimization

#### Next.js Image Component
```tsx
import Image from 'next/image';

<Image
  src="/campaign.jpg"
  alt="Campaign image"
  width={800}
  height={400}
  loading="lazy"
  placeholder="blur"
/>
```

#### Benefits
- Automatic WebP conversion
- Lazy loading
- Responsive images
- Blur placeholder

### 6. CSS Optimization

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Critical CSS
- TailwindCSS purges unused styles
- Only used classes are included in build

## Performance Metrics

### Core Web Vitals Targets

#### LCP (Largest Contentful Paint)
- **Target:** < 2.5s
- **Current:** Monitor with Google PageSpeed Insights
- **Optimization:** Lazy load images, optimize fonts

#### FID (First Input Delay)
- **Target:** < 100ms
- **Current:** Monitor with Google PageSpeed Insights
- **Optimization:** Debounce inputs, minimize main thread work

#### CLS (Cumulative Layout Shift)
- **Target:** < 0.1
- **Current:** Monitor with Google PageSpeed Insights
- **Optimization:** Use skeletons, reserve space for images

### Custom Metrics

#### Time to Interactive (TTI)
- **Target:** < 5s
- **Optimization:** Code splitting, lazy loading

#### Bundle Size
- **Target:** < 200KB gzipped
- **Tool:** `next build` output
- **Optimization:** Tree shaking, dynamic imports

## Performance Testing

### Lighthouse
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

### Bundle Analyzer
```bash
# Install
npm install --save-dev @next/bundle-analyzer

# Update next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true npm run build
```

### React DevTools Profiler
1. Open React DevTools in browser
2. Go to "Profiler" tab
3. Click record
4. Interact with app
5. Stop recording
6. Analyze render performance

## Best Practices

### 1. Component Optimization

#### Use React.memo for Pure Components
```tsx
import { memo } from 'react';

const CampaignCard = memo(({ campaign }) => {
  // Component code
});
```

#### Avoid Inline Functions
```tsx
// ❌ Bad - creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Good - stable reference
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);

<button onClick={handleButtonClick}>Click</button>
```

### 2. State Management

#### Keep State Close to Where It's Used
```tsx
// ❌ Bad - global state for local concern
const [isOpen, setIsOpen] = useGlobalState('modalOpen');

// ✅ Good - local state
const [isOpen, setIsOpen] = useState(false);
```

#### Avoid Unnecessary Re-renders
```tsx
// Use Context sparingly
// Split contexts by concern
<UserContext.Provider>
  <ThemeContext.Provider>
    {/* ... */}
  </ThemeContext.Provider>
</UserContext.Provider>
```

### 3. GraphQL Optimization

#### Use Fragments
```graphql
fragment CampaignBasic on Campaign {
  id
  title
  amountRaised
  amountSought
}

query GetCampaigns {
  campaigns {
    ...CampaignBasic
  }
}
```

#### Cache Management
```tsx
// Apollo Client cache configuration
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Campaign: {
        keyFields: ['id'],
      },
    },
  }),
});
```

### 4. Network Optimization

#### Prefetch Data
```tsx
import Link from 'next/link';

// Next.js prefetches on hover/viewport
<Link href="/projects/0x123" prefetch>
  View Campaign
</Link>
```

#### Request Deduplication
```tsx
// Apollo Client deduplicates identical queries automatically
const { data } = useQuery(GET_CAMPAIGN, {
  variables: { id },
  // These are deduplicated if called multiple times
});
```

## Monitoring

### Setup Analytics

#### Google Analytics
```tsx
// app/layout.tsx
import Script from 'next/script';

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
```

#### Web Vitals
```tsx
// app/layout.tsx
export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics
}
```

### Error Tracking

#### Sentry Integration
```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

## Checklist

### Before Deployment
- [ ] Run Lighthouse audit (score > 90)
- [ ] Check bundle size (`next build`)
- [ ] Test on slow 3G network
- [ ] Verify images are optimized
- [ ] Check for console errors/warnings
- [ ] Test with React Profiler
- [ ] Verify lazy loading works
- [ ] Test debounced inputs
- [ ] Check GraphQL query efficiency
- [ ] Verify loading skeletons
- [ ] Test error boundaries
- [ ] Check accessibility (WCAG 2.1 AA)

### Regular Monitoring
- [ ] Weekly Lighthouse audits
- [ ] Monthly bundle size review
- [ ] Quarterly dependency updates
- [ ] Review slow queries in GraphQL
- [ ] Check for memory leaks
- [ ] Monitor Core Web Vitals
- [ ] Review error logs

## Common Performance Issues

### Issue: Slow Initial Load
**Solutions:**
- Enable code splitting
- Lazy load heavy components
- Optimize images
- Reduce bundle size

### Issue: Janky Scrolling
**Solutions:**
- Throttle scroll handlers
- Use CSS transforms instead of position
- Implement virtual scrolling for long lists

### Issue: Slow Form Inputs
**Solutions:**
- Debounce input handlers
- Avoid controlled components where possible
- Use React Hook Form for complex forms

### Issue: Memory Leaks
**Solutions:**
- Clean up event listeners in useEffect
- Cancel pending requests on unmount
- Clear intervals/timeouts

## Future Optimizations

### Potential Improvements
- [ ] Implement service worker for offline support
- [ ] Add HTTP/2 server push
- [ ] Use CDN for static assets
- [ ] Implement edge caching
- [ ] Add progressive hydration
- [ ] Implement virtual scrolling for long lists
- [ ] Use WebAssembly for heavy computations
- [ ] Implement request coalescing
- [ ] Add resource hints (preconnect, dns-prefetch)
- [ ] Optimize font loading strategy

## Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
