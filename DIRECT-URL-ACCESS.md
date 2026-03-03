# Direct URL Access Configuration for GitHub Pages

This project has been configured to support direct URL access to all routes when deployed on GitHub Pages.

## How It Works

### The Problem
Single Page Applications (SPAs) use client-side routing, which means all routes are handled by JavaScript in the browser. When deployed to GitHub Pages:
- Navigating within the app works fine (clicking links)
- But accessing a route directly via URL (e.g., `https://sssunsha.github.io/category/english/grade3-term2-textbook/learn-texts`) returns a 404 error from GitHub Pages server

### The Solution
We use a common pattern for GitHub Pages SPAs:

1. **404.html Redirect**: When GitHub Pages can't find a file, it serves `404.html`
2. **URL Encoding**: The 404.html script encodes the requested path into the query string
3. **Index.html Script**: The index.html script decodes the query string and restores the original path
4. **Angular Router**: Once the path is restored, Angular's router takes over and displays the correct page

## Files Modified

### 1. `src/404.html`
Created a new 404 page that:
- Captures the requested URL path
- Encodes it into a query string format
- Redirects to index.html with the encoded path

### 2. `src/index.html`
Added a script in the `<head>` section that:
- Checks if the URL contains an encoded redirect from 404.html
- Decodes the query string back to the original path
- Uses `window.history.replaceState()` to update the browser URL without reloading

### 3. `angular.json`
Updated the assets configuration to include `src/404.html` so it gets copied to the build output.

## How to Test

### Local Testing
Unfortunately, this pattern only works on GitHub Pages (or similar static hosting). Local development server already handles all routes correctly.

### After Deployment
1. Deploy the application to GitHub Pages using `npm run deploy`
2. Try accessing any route directly in the browser:
   - `https://sssunsha.github.io/category/english`
   - `https://sssunsha.github.io/category/english/grade3-term2-textbook`
   - `https://sssunsha.github.io/category/english/grade3-term2-textbook/learn-texts`
   - etc.
3. All routes should now work correctly!

## Example Flow

When a user navigates to: `https://sssunsha.github.io/category/english/grade3-term2-textbook/learn-texts`

1. GitHub Pages can't find that file → serves `404.html`
2. 404.html script transforms URL to: `https://sssunsha.github.io/?/category/english/grade3-term2-textbook/learn-texts`
3. GitHub Pages serves `index.html`
4. Script in index.html detects the `?/` pattern
5. Restores the URL to: `https://sssunsha.github.io/category/english/grade3-term2-textbook/learn-texts`
6. Angular router reads the path and displays the correct component

## Alternative Solutions

If you encounter any issues, there's an alternative approach using **Hash-based routing**:

### Option: Use Hash-based Routing
In `src/app/app.config.ts`, change:
```typescript
provideRouter(routes)
```
to:
```typescript
provideRouter(routes, withHashLocation())
```

This makes URLs look like: `https://sssunsha.github.io/#/category/english`

**Pros**: Works everywhere, no server configuration needed
**Cons**: URLs have `#` in them, less clean for SEO

## References
- Based on: https://github.com/rafgraph/spa-github-pages
- Angular Router: https://angular.dev/guide/routing