# Portfolio Integration Guide for Adminezer Demo

## Option 1: Subdirectory Integration (Recommended)

Deploy the demo to a subdirectory of your portfolio:
- **Main Portfolio**: `https://kyleseanportfolio.com`
- **Adminezer Demo**: `https://kyleseanportfolio.com/adminezer`

### Steps:
1. Build the demo: `npm run build:demo`
2. Upload contents of `dist/` folder to `/adminezer/` directory on your server
3. Update your portfolio to link to the demo

### Portfolio Link Example:
```html
<div class="project-card">
  <h3>Adminezer - Nonprofit Document Management</h3>
  <p>Full-stack React application with Supabase backend...</p>
  <div class="project-links">
    <a href="/adminezer" target="_blank" class="demo-btn">
      🚀 Live Demo
    </a>
    <a href="https://github.com/yourusername/adminezer" class="code-btn">
      📝 View Code
    </a>
  </div>
</div>
```

## Option 2: Subdomain Integration

Create a subdomain specifically for the demo:
- **Main Portfolio**: `https://kyleseanportfolio.com`
- **Adminezer Demo**: `https://adminezer.kyleseanportfolio.com`

### Steps:
1. Create subdomain in your hosting control panel
2. Build demo: `npm run build:demo`
3. Upload to subdomain root directory

## Option 3: Modal/Iframe Integration

Embed the demo directly in your portfolio page:

```html
<div class="project-showcase">
  <h3>Adminezer Demo</h3>
  <button onclick="openDemo()" class="demo-button">
    Launch Interactive Demo
  </button>
  
  <!-- Modal with iframe -->
  <div id="demo-modal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeDemo()">&times;</span>
      <iframe src="/adminezer" width="100%" height="600px"></iframe>
    </div>
  </div>
</div>
```

## Option 4: Direct Replacement (Full Portfolio as Demo)

Replace your entire portfolio temporarily with the demo:
- Good for interviews or specific presentations
- Easy to switch back to portfolio

## Recommended Approach: Option 1 (Subdirectory)

### File Structure:
```
kyleseanportfolio.com/
├── index.html (your portfolio)
├── css/
├── js/
├── images/
└── adminezer/ (demo app)
    ├── index.html
    ├── assets/
    └── ...
```

### Portfolio Integration Code:
```html
<!-- In your portfolio's project section -->
<section class="project" id="adminezer">
  <div class="project-header">
    <h2>Adminezer</h2>
    <span class="tech-stack">React • TypeScript • Supabase • Tailwind CSS</span>
  </div>
  
  <div class="project-content">
    <div class="project-description">
      <p>A comprehensive document management system designed for nonprofit organizations...</p>
      
      <h3>Key Features:</h3>
      <ul>
        <li>📄 Document upload and categorization</li>
        <li>👥 Multi-tenant user management</li>
        <li>🔗 OAuth integrations</li>
        <li>📊 Business operations dashboard</li>
        <li>🔐 Role-based access control</li>
      </ul>
    </div>
    
    <div class="project-demo">
      <div class="demo-preview">
        <img src="adminezer-screenshot.png" alt="Adminezer Dashboard">
        <div class="demo-overlay">
          <a href="/adminezer" target="_blank" class="demo-link">
            🚀 Launch Live Demo
          </a>
        </div>
      </div>
    </div>
  </div>
  
  <div class="project-links">
    <a href="/adminezer" target="_blank" class="btn btn-primary">
      Live Demo
    </a>
    <a href="https://github.com/yourusername/adminezer" class="btn btn-secondary">
      View Code
    </a>
  </div>
</section>
```

### CSS for Demo Integration:
```css
.project {
  margin: 2rem 0;
  padding: 2rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.demo-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.demo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.demo-preview:hover .demo-overlay {
  opacity: 1;
}

.demo-link {
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  background: #3b82f6;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s ease;
}

.demo-link:hover {
  background: #2563eb;
}
```

## Benefits of Subdirectory Approach:

✅ **SEO Friendly**: All under your main domain
✅ **Easy Navigation**: Visitors stay on your portfolio site
✅ **Professional**: Clean URL structure
✅ **Flexible**: Easy to update or replace
✅ **Analytics**: Track demo usage alongside portfolio metrics

## Next Steps:

1. Choose your preferred integration method
2. Build the demo: `npm run build:demo`
3. Upload to your chosen location
4. Update your portfolio to showcase the demo
5. Test the integration thoroughly

The subdirectory approach (`kyleseanportfolio.com/adminezer`) is most recommended as it keeps everything under your portfolio domain while providing a seamless experience for visitors.