# Sentry Error Tracking Setup Guide

This guide explains how to set up Sentry error tracking for the ACIL application.

## Overview

Sentry provides real-time error tracking and monitoring for both client-side and server-side errors. The integration includes:

- **Client-side error tracking**: Browser errors, React component errors
- **Server-side error tracking**: API errors, server-side rendering errors
- **Edge runtime tracking**: Middleware and edge function errors
- **Session replay**: Visual playback of user sessions when errors occur
- **Performance monitoring**: Track API response times and page load performance
- **Source maps**: Automatic source map upload for production debugging

## Initial Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project and select "Next.js" as the platform
3. Note down your DSN (Data Source Name) - you'll need this for configuration

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token  # Only needed for production builds
```

#### Getting Your Auth Token

1. Go to Sentry Settings → Account → API → Auth Tokens
2. Create a new token with the following permissions:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy the token and add it to your environment variables

### 3. Development vs Production

**Development:**
- Sentry is configured but source maps are not uploaded
- All errors are tracked (100% sample rate)
- Session replay is disabled to save resources
- Debug mode is enabled for detailed logs

**Production:**
- Source maps are automatically uploaded during build
- 10% error sample rate to manage quota
- Session replay enabled for errors (100% of errors)
- Session replay sampling: 10% of all sessions
- Debug mode disabled

## Configuration Files

The Sentry integration consists of several configuration files:

### Client Configuration (`sentry.client.config.ts`)

Handles browser-side error tracking:
- React component errors
- Browser API errors
- Network errors
- User interactions via session replay

### Server Configuration (`sentry.server.config.ts`)

Handles server-side error tracking:
- API route errors
- Server-side rendering errors
- Database errors
- External API errors

### Edge Configuration (`sentry.edge.config.ts`)

Handles edge runtime errors:
- Middleware errors
- Edge function errors

### Instrumentation (`instrumentation.ts`)

Initializes Sentry based on the runtime environment. This file is automatically loaded by Next.js.

## Error Boundaries

The application uses React Error Boundaries integrated with Sentry:

### Component-Level Errors (`components/ErrorBoundary.tsx`)

Catches errors in React components and automatically reports them to Sentry with:
- Error message and stack trace
- Component stack information
- User-friendly fallback UI

### Page-Level Errors (`app/error.tsx`)

Catches errors in pages and layouts:
- Next.js App Router errors
- Error digest tracking
- Retry functionality

### Global Errors (`app/global-error.tsx`)

Catches critical errors in the root layout:
- Marked as "fatal" severity in Sentry
- Tagged with error type
- Full page error UI

## Sensitive Data Protection

The Sentry configuration automatically filters out sensitive data:

**Client-side:**
- Cookies and authorization headers
- Browser extension errors
- Known benign errors (ResizeObserver, etc.)

**Server-side:**
- API keys and secrets (OPENAI_API_KEY, GEMINI_API_KEY, etc.)
- Database credentials
- Authentication tokens
- All environment variables containing: KEY, SECRET, TOKEN, PASSWORD

**Session Replay:**
- All text is masked by default
- All media is blocked by default
- Only UI interactions and error contexts are recorded

## Testing the Integration

### Test in Development

1. Start the dev server: `npm run dev`
2. Trigger a test error in your browser console:
   ```javascript
   throw new Error('Test Sentry error')
   ```
3. Check your Sentry dashboard - the error should appear within a few seconds

### Test Error Boundary

Create a component that throws an error:

```tsx
function TestErrorComponent() {
  throw new Error('Test error boundary')
  return null
}
```

Wrap it in ErrorBoundary and verify the error appears in Sentry.

### Test API Errors

Add a test error in an API route:

```typescript
// app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test API error')
}
```

Call this endpoint and verify the error in Sentry.

## Monitoring and Alerts

### Setting Up Alerts

1. Go to Sentry → Alerts
2. Create alert rules for:
   - New error types
   - Error frequency spikes
   - Specific error patterns
   - Performance degradation

### Recommended Alert Rules

**Critical Errors:**
- Trigger: Any error with level "fatal"
- Action: Email + Slack notification

**High Error Rate:**
- Trigger: More than 50 errors in 5 minutes
- Action: Email notification

**New Error Types:**
- Trigger: First occurrence of a new error
- Action: Slack notification

## Performance Monitoring

Sentry tracks performance metrics:

- **API Response Times**: Track slow API routes
- **Page Load Performance**: Monitor LCP, FCP, TTFB
- **Database Query Performance**: Identify slow queries
- **External API Latency**: Monitor third-party service calls

### Performance Sample Rates

- Development: 100% of transactions
- Production: 10% of transactions (to manage quota)

## Source Maps

Source maps are automatically uploaded in production builds:

1. Build creates optimized, minified code
2. Sentry webpack plugin uploads source maps
3. Source maps are hidden from client bundles
4. Errors show original source code in Sentry dashboard

## Quota Management

Free Sentry tier includes:
- 5,000 errors per month
- 1,000 performance transactions
- 50 replays

### Tips to Stay Within Quota

1. **Use appropriate sample rates:**
   - 10% for performance in production
   - 10% for session replay in production
   - 100% for errors with sampling (already configured)

2. **Filter out expected errors:**
   - Validation errors (ZodError)
   - Auth errors (expected logout scenarios)
   - Rate limit errors (expected API limits)

3. **Use error grouping:**
   - Similar errors are automatically grouped
   - Reduce duplicate error counts

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check NEXT_PUBLIC_SENTRY_DSN is set correctly
2. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_SENTRY_DSN)`
3. Check browser console for Sentry initialization errors
4. Ensure you're not blocking sentry.io in your adblocker

### Source Maps Not Working

1. Verify SENTRY_AUTH_TOKEN is set in production environment
2. Check build logs for source map upload errors
3. Verify SENTRY_ORG and SENTRY_PROJECT match your Sentry settings
4. Ensure the auth token has correct permissions

### Too Many Events

1. Adjust sample rates in sentry.*.config.ts files
2. Add more errors to ignoreErrors arrays
3. Use beforeSend to filter specific error types
4. Enable error grouping and ignore specific issues in Sentry dashboard

## Best Practices

1. **Don't log sensitive data:**
   - Never include passwords, API keys, or personal data in error messages
   - Use beforeSend to filter additional sensitive data

2. **Use proper error context:**
   - Add user context: `Sentry.setUser({ id, email })`
   - Add custom tags: `Sentry.setTag('feature', 'ai-analysis')`
   - Add breadcrumbs: `Sentry.addBreadcrumb({ message: 'User clicked analyze' })`

3. **Handle expected errors:**
   - Don't send validation errors to Sentry
   - Filter out rate limit errors
   - Use try-catch for expected failures

4. **Test in staging:**
   - Set up a separate Sentry project for staging
   - Test error tracking before production deployment

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

## Support

For issues with Sentry integration:
1. Check the troubleshooting section above
2. Review Sentry documentation
3. Contact the development team
4. Create an issue in the project repository
