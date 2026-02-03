# Wix Integration Guide for Adminezer Demo

## Option 1: External Hosting + Wix Link (Recommended)

Since Wix doesn't allow direct file uploads for custom applications, you'll need to host the demo externally and link to it from your Wix portfolio.

### Step 1: Host the Demo Externally

**Free Hosting Options:**
- **Netlify** (Recommended)
- **Vercel** 
- **GitHub Pages**
- **Firebase Hosting**

### Step 2: Deploy to Netlify (Easiest)

1. **Build the demo:**
   ```bash
   npm run build:demo
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `dist` folder
   - Get your demo URL (e.g., `https://adminezer-demo.netlify.app`)

3. **Optional: Custom Domain**
   - Use a subdomain like `adminezer.kyleseanportfolio.com`
   - Point it to your Netlify deployment

### Step 3: Integrate into Wix Portfolio

**Method A: Project Section with External Link**

1. **Add a Project Section** in Wix Editor
2. **Create Project Card:**
   - Title: "Adminezer - Nonprofit Document Management"
   - Description: Your project description
   - Tech Stack: React, TypeScript, Supabase, Tailwind CSS
   - Screenshot: Upload a screenshot of the dashboard

3. **Add Demo Button:**
   - Button text: "🚀 Live Demo"
   - Link to: `https://your-demo-url.netlify.app`
   - Set to open in new tab

**Method B: Embedded Section**

1. **Add HTML Embed Element** in Wix
2. **Embed Code:**
```html
<div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
  <h3 style="color: #1e293b; margin-bottom: 10px;">Adminezer Demo</h3>
  <p style="color: #64748b; margin-bottom: 20px;">Interactive nonprofit document management system</p>
  <a href="https://your-demo-url.netlify.app" target="_blank" 
     style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.3s ease;">
    🚀 Launch Demo
  </a>
  <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
    Demo includes sample data for portfolio demonstration
  </p>
</div>
```

## Option 2: Wix App Market Integration

**Create a Custom App Button:**

1. **Add Button Element** in Wix Editor
2. **Style the Button:**
   - Text: "View Adminezer Demo"
   - Design: Match your portfolio theme
   - Add hover effects

3. **Link Settings:**
   - Action: "Link to Web"
   - URL: Your demo URL
   - Target: "New Tab"

## Option 3: Portfolio Gallery Integration

**Add to Project Gallery:**

1. **Create Project Gallery** in Wix
2. **Add Adminezer Project:**
   - Upload screenshots
   - Add project description
   - Include demo link in description
   - Add "View Demo" button overlay

## Option 4: Lightbox Integration

**Create Interactive Lightbox:**

1. **Add Image Element** (screenshot of Adminezer)
2. **Set Click Action:**
   - Action: "Open Lightbox"
   - Create custom lightbox with:
     - Project details
     - Tech stack
     - Demo link button
     - GitHub link

## Recommended Wix Setup

### Page Structure:
```
Portfolio Page
├── Hero Section
├── About Section
├── Projects Section
│   ├── Project 1
│   ├── Adminezer (Featured)
│   │   ├── Screenshot
│   │   ├── Description
│   │   ├── Tech Stack Tags
│   │   ├── "Live Demo" Button → External Link
│   │   └── "View Code" Button → GitHub
│   └── Other Projects
└── Contact Section
```

### Wix Elements to Use:

1. **Text Elements:**
   - Project title
   - Description
   - Tech stack

2. **Image Element:**
   - Adminezer dashboard screenshot
   - Add hover effects

3. **Button Elements:**
   - "Live Demo" → External demo URL
   - "View Code" → GitHub repository

4. **Container/Strip:**
   - Group all Adminezer elements
   - Add background styling

## Step-by-Step Wix Implementation:

### 1. Prepare Your Demo
```bash
# Build the demo
npm run build:demo

# Deploy to Netlify (drag & drop dist folder)
# Get your demo URL: https://adminezer-demo.netlify.app
```

### 2. In Wix Editor:

**Add Project Section:**
1. Click "Add" → "Strip" 
2. Choose a layout for your project
3. Add elements:
   - **Heading**: "Adminezer"
   - **Text**: Project description
   - **Image**: Upload dashboard screenshot
   - **Button**: "Live Demo"

**Configure Demo Button:**
1. Select the button
2. Click "Link" 
3. Choose "Web URL"
4. Enter: `https://your-demo-url.netlify.app`
5. Check "Open in new tab"

**Style the Section:**
1. Add background color/gradient
2. Set proper spacing
3. Make it responsive
4. Add hover effects to image

### 3. Add Tech Stack Tags:
```html
<!-- In HTML Embed element -->
<div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 10px 0;">
  <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">React</span>
  <span style="background: #06b6d4; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">TypeScript</span>
  <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">Supabase</span>
  <span style="background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">Tailwind CSS</span>
</div>
```

## Benefits of This Approach:

✅ **Professional**: Clean integration with your Wix portfolio
✅ **Fast Loading**: External hosting ensures good performance
✅ **SEO Friendly**: Proper linking structure
✅ **Easy Updates**: Update demo without touching Wix
✅ **Analytics**: Track demo usage separately
✅ **Mobile Friendly**: Works on all devices

## Pro Tips:

1. **Take High-Quality Screenshots**: Use the dashboard, document list, and operations pages
2. **Add Loading States**: Mention demo loads in new tab
3. **Include Demo Notice**: Let visitors know it's a portfolio demo
4. **Mobile Optimization**: Ensure buttons work well on mobile
5. **Track Analytics**: Use Google Analytics on both sites

The external hosting + Wix integration approach gives you the best of both worlds: professional portfolio presentation with a fully functional demo that showcases your development skills.