# Dual Version Management Guide

## Current Setup

You have two versions of your language learning course:
- **Free Version** (`free_module/`): Limited access with payment popup
- **Full Version** (`course/`): Complete access to all modules

## Recommended Architecture Improvements

### 1. Shared Codebase with Feature Flags

Instead of maintaining two separate copies, consider this structure:

```
src/
├── shared/
│   ├── js/
│   │   ├── main.js
│   │   ├── utils.js
│   │   ├── dbService.js
│   │   └── ...
│   ├── views/
│   │   ├── word-detail.html
│   │   ├── practice.html
│   │   └── menu.html
│   └── css/
├── free/
│   ├── index.html
│   ├── config.js (with isFreeVersion: true)
│   └── views/
│       └── payment-popup.html
├── full/
│   ├── index.html
│   └── config.js (with isFreeVersion: false)
└── build/
    ├── free_module/ (build output)
    └── course/ (build output)
```

### 2. Feature Flag Implementation

**config.js for each version:**

```javascript
// free/config.js
export const APP_CONFIG = {
    isFreeVersion: true,
    maxFreeModules: 1,
    paymentUrl: 'https://whop.com/checkout/plan_5uZOPS526rjvI?d2c=true',
    TARGET_LANGUAGE_CODE: 'your_language_code',
    VIEWS: {
        WORD_DETAIL: '../shared/views/word-detail.html',
        PRACTICE: '../shared/views/practice.html',
        MENU: '../shared/views/menu.html',
        PAYMENT_POPUP: 'views/payment-popup.html'
    }
};

// full/config.js
export const APP_CONFIG = {
    isFreeVersion: false,
    maxFreeModules: Infinity,
    TARGET_LANGUAGE_CODE: 'your_language_code',
    VIEWS: {
        WORD_DETAIL: '../shared/views/word-detail.html',
        PRACTICE: '../shared/views/practice.html',
        MENU: '../shared/views/menu.html'
    }
};
```

### 3. Access Control Logic

**Centralized access control in shared/js/accessControl.js:**

```javascript
import { APP_CONFIG } from '../config.js';

export class AccessControl {
    static isModuleFree(moduleId, modules) {
        if (!APP_CONFIG.isFreeVersion) {
            return true; // Full version has access to everything
        }
        
        // Sort modules by ID to ensure consistent ordering
        const sortedModules = [...modules].sort((a, b) => a.id - b.id);
        const freeModuleIds = sortedModules
            .slice(0, APP_CONFIG.maxFreeModules)
            .map(m => m.id);
        
        return freeModuleIds.includes(moduleId);
    }
    
    static showPaymentPopup() {
        if (!APP_CONFIG.isFreeVersion) {
            return; // No payment popup for full version
        }
        
        const popup = document.getElementById('payment-popup');
        if (popup) {
            popup.style.display = 'flex';
        }
    }
    
    static checkAccessAndNavigate(moduleId, modules, navigateCallback) {
        if (this.isModuleFree(moduleId, modules)) {
            navigateCallback();
        } else {
            this.showPaymentPopup();
        }
    }
}
```

### 4. Build System

**package.json scripts:**

```json
{
  "scripts": {
    "build:free": "node build-scripts/build-free.js",
    "build:full": "node build-scripts/build-full.js",
    "build:all": "npm run build:free && npm run build:full",
    "sync:changes": "node build-scripts/sync-changes.js",
    "deploy:free": "gh-pages -d build/free_module -r origin-free",
    "deploy:full": "gh-pages -d build/course -r origin-full"
  }
}
```

## Current Solution Implementation

Since you need an immediate solution, I've updated your full version with the improvements from the free version:

### Changes Made:

1. **Enhanced Mobile Menu**: Better responsive behavior with proper state management
2. **Improved Logging**: More detailed console logging for debugging
3. **Better Error Handling**: Enhanced error reporting and fallback mechanisms
4. **UI Improvements**: Better button styling and menu interactions

### Synchronization Workflow

For now, to sync changes between versions:

1. **Make changes to the free version first** (since it has more constraints)
2. **Test thoroughly** in the free version
3. **Copy improvements to full version** removing payment-related code
4. **Test full version** to ensure no access restrictions were accidentally introduced

## Automation Scripts

### Change Synchronization Script

Create `sync-changes.js`:

```javascript
const fs = require('fs-extra');
const path = require('path');

const SHARED_FILES = [
    'js/utils.js',
    'js/dbService.js',
    'js/wordService.js',
    'js/moduleService.js',
    'js/practiceService.js',
    'js/viewLoader.js',
    'js/state.js',
    'views/word-detail.html',
    'views/practice.html',
    'views/menu.html'
];

async function syncChanges() {
    console.log('Syncing shared files...');
    
    for (const file of SHARED_FILES) {
        const freePath = path.join('free_module', file);
        const fullPath = path.join('course', file);
        
        if (await fs.pathExists(freePath)) {
            let content = await fs.readFile(freePath, 'utf8');
            
            // Remove payment-related code for full version
            content = removePaymentCode(content);
            
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, content);
            
            console.log(`✓ Synced ${file}`);
        }
    }
}

function removePaymentCode(content) {
    // Remove payment-related functions and imports
    return content
        .replace(/\/\/ ---- payment popup functions ----[\s\S]*?(?=\/\/ ----|\Z)/g, '')
        .replace(/showPaymentPopup\(\)[^}]*}/g, '{}')
        .replace(/isModuleFree\([^}]*\{[^}]*\}/g, 'isModuleFree() { return true; }')
        .replace(/PAYMENT_POPUP:.*$/gm, '')
        .replace(/paymentPopupHtml.*$/gm, '')
        .replace(/if \(!this\.isModuleFree[^}]*}/g, '// Access granted for full version');
}

syncChanges().catch(console.error);
```

## Git Workflow Recommendations

### Branch Strategy

```bash
# Main development branches
git checkout -b feature/new-functionality
git checkout -b hotfix/urgent-fix

# Version-specific branches when needed
git checkout -b free-version/payment-updates
git checkout -b full-version/premium-features
```

### Deployment Strategy

1. **Separate Repositories**: Keep separate GitHub repos for deployment
2. **Main Development Repo**: Use one repo for development with both versions
3. **Automated Deployment**: Use GitHub Actions to build and deploy both versions

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Both Versions

on:
  push:
    branches: [ main ]

jobs:
  deploy-free:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Free Version
        run: npm run build:free
      - name: Deploy to Free Repo
        run: |
          # Deploy free_module/ to GitHub Pages

  deploy-full:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Full Version
        run: npm run build:full
      - name: Deploy to Full Repo
        run: |
          # Deploy course/ to GitHub Pages
```

## Testing Strategy

1. **Feature Parity Tests**: Ensure both versions have the same core functionality
2. **Access Control Tests**: Verify payment restrictions only apply to free version
3. **UI/UX Tests**: Check responsive behavior on both versions
4. **Cross-browser Testing**: Test both versions across different browsers

## Monitoring and Analytics

1. **Error Tracking**: Implement error tracking for both versions
2. **Usage Analytics**: Track user behavior differences between versions
3. **Conversion Tracking**: Monitor free-to-paid conversion rates

## Future Considerations

1. **Server-Side Rendering**: Consider SSR for better SEO
2. **Progressive Web App**: Add PWA features for better user experience
3. **Content Management**: Consider a CMS for course content updates
4. **A/B Testing**: Test different approaches to conversion optimization

This approach will help you maintain consistency while reducing duplicate work and ensuring both versions stay in sync with improvements. 