# Setting Up Your Website with the jamestennis.world Domain

This guide will help you connect your interactive 3D Earth map to your domain name.

## Option 1: Using GitHub Pages (Free and Easy)

1. **Create a GitHub Repository**
   - Sign up for a GitHub account if you don't have one
   - Create a new repository (e.g., "tennis-map")
   - Upload all your website files (index.html, styles.css, main.js)

2. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select "main" branch as the source
   - Click Save
   - Your site will be published at `https://yourusername.github.io/tennis-map/`

3. **Set Up Custom Domain**
   - In GitHub Pages settings, enter your domain: `jamestennis.world`
   - Create a file named "CNAME" in your repository with just your domain: `jamestennis.world`

4. **Configure DNS at Your Domain Registrar**
   - Log into your domain registrar account (where you purchased jamestennis.world)
   - Add these DNS records:
     - Type: A, Name: @, Value: 185.199.108.153
     - Type: A, Name: @, Value: 185.199.109.153
     - Type: A, Name: @, Value: 185.199.110.153
     - Type: A, Name: @, Value: 185.199.111.153
     - Type: CNAME, Name: www, Value: yourusername.github.io

5. **Wait for DNS Propagation**
   - DNS changes can take 24-48 hours to fully propagate
   - Your site should then be accessible at jamestennis.world

## Option 2: Using Traditional Web Hosting

1. **Sign Up for Web Hosting**
   - Choose a web hosting provider (e.g., Bluehost, HostGator, SiteGround)
   - Select a basic hosting plan

2. **Upload Your Website Files**
   - Use the hosting provider's file manager or FTP
   - Upload your website files to the public_html or www directory

3. **Connect Your Domain**
   - In your domain registrar, update nameservers to point to your hosting provider
   - Alternatively, add a DNS A record pointing to your hosting provider's IP
   - Follow your hosting provider's specific instructions for connecting domains

4. **Test Your Website**
   - After DNS propagation (24-48 hours), your site should be accessible at jamestennis.world

## Option 3: Using Netlify (Modern and Developer-Friendly)

1. **Sign Up for Netlify**
   - Create a free account at netlify.com

2. **Deploy Your Site**
   - Drag and drop your website folder onto Netlify's dashboard, OR
   - Connect your GitHub repository for continuous deployment

3. **Add Your Custom Domain**
   - Go to Site Settings > Domain Management
   - Click "Add custom domain" and enter: jamestennis.world
   - Follow Netlify's instructions to verify domain ownership

4. **Update DNS Settings**
   - Either use Netlify's nameservers (recommended) OR
   - Add the CNAME or A records Netlify provides to your domain registrar

5. **Enable HTTPS**
   - Netlify will automatically provision a free SSL certificate
   - This gives your site the secure https:// protocol

For more specific help based on your domain registrar or preferred hosting method, please provide additional details. 