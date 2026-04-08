# Caire Room Dashboard — Deployment & Go-Live Guide

This guide walks through every step to take the dashboard from a local dev build to a production deployment connected to your Caire Inc M365 tenant.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Entra ID App Registration](#2-entra-id-app-registration)
3. [Create the EA Security Group](#3-create-the-ea-security-group)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Local Validation](#5-local-validation)
6. [Deployment Options](#6-deployment-options)
   - [Option A: Vercel](#option-a-vercel)
   - [Option B: Self-Hosted (IIS / Node.js on Windows Server)](#option-b-self-hosted-iis--nodejs-on-windows-server)
   - [Option C: Docker](#option-c-docker)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [DNS & SSL](#8-dns--ssl)
9. [Monitoring & Audit Logs](#9-monitoring--audit-logs)
10. [Rollback Procedure](#10-rollback-procedure)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before starting, confirm you have:

- [ ] **Global Admin** or **Application Administrator** role in Entra ID
- [ ] **Exchange Admin** access (to verify room mailboxes exist)
- [ ] Node.js 20+ installed on the build machine
- [ ] Git access to `https://github.com/FusedIcer8/caire-room-dashboard`
- [ ] A deployment target (Vercel account, Windows Server, or Docker host)

### Verify Room Mailboxes Exist

The dashboard reads from room mailbox calendars. Confirm your rooms are configured in Exchange Online:

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline -UserPrincipalName admin@caireinc.com

# List all room mailboxes
Get-Mailbox -RecipientTypeDetails RoomMailbox | Select-Object DisplayName, PrimarySmtpAddress, ResourceCapacity | Format-Table -AutoSize

# Verify a specific room is bookable
Get-CalendarProcessing -Identity "boardroom-a@caireinc.com" | Select-Object AutomateProcessing, AllowConflicts, BookingWindowInDays
```

Expected output: rooms should have `AutomateProcessing: AutoAccept` for the dashboard to book them.

---

## 2. Entra ID App Registration

### Step 2.1: Register the Application

1. Go to **Azure Portal** → **Entra ID** → **App registrations** → **New registration**
2. Fill in:
   - **Name:** `Caire Room Dashboard`
   - **Supported account types:** `Accounts in this organizational directory only (Caire Inc only — Single tenant)`
   - **Redirect URI:** Select `Single-page application (SPA)` and enter:
     - For local dev: `http://localhost:3000`
     - For production: `https://rooms.caireinc.com` (your production URL)
3. Click **Register**

### Step 2.2: Record IDs

After registration, note these values from the **Overview** page:

| Value | Where to Find | Env Variable |
|-------|--------------|-------------|
| Application (client) ID | Overview → Application (client) ID | `AZURE_CLIENT_ID` / `NEXT_PUBLIC_AZURE_CLIENT_ID` |
| Directory (tenant) ID | Overview → Directory (tenant) ID | `AZURE_TENANT_ID` / `NEXT_PUBLIC_AZURE_TENANT_ID` |

### Step 2.3: Create a Client Secret

1. Go to **Certificates & secrets** → **Client secrets** → **New client secret**
2. Description: `Room Dashboard Production`
3. Expires: **24 months** (set a calendar reminder to rotate before expiry)
4. Click **Add**
5. **Copy the Value immediately** — it won't be shown again

| Value | Env Variable |
|-------|-------------|
| Client secret Value | `AZURE_CLIENT_SECRET` |

### Step 2.4: Add API Permissions

1. Go to **API permissions** → **Add a permission** → **Microsoft Graph**
2. Select **Application permissions** (not Delegated)
3. Add these two:
   - `Calendars.ReadWrite` — read/write events on all room calendars
   - `Place.Read.All` — list all room resources
4. Click **Grant admin consent for Caire Inc**
5. Verify both show a green checkmark under "Status"

```
✅ Calendars.ReadWrite    Application    Granted for Caire Inc
✅ Place.Read.All         Application    Granted for Caire Inc
```

### Step 2.5: Configure Token Claims

1. Go to **Token configuration** → **Add groups claim**
2. Select **Security groups**
3. Under **ID token**, check **Group ID**
4. Click **Add**

This ensures the user's security group memberships are included in their SSO token, which the dashboard uses to verify EA access.

### Step 2.6: Add Additional Redirect URIs (if needed)

Go to **Authentication** → **Single-page application** → **Redirect URIs**:

```
http://localhost:3000          ← local development
https://rooms.caireinc.com     ← production
https://staging-rooms.caireinc.com  ← staging (if applicable)
```

---

## 3. Create the EA Security Group

### Step 3.1: Create the Group

```powershell
# Connect to Microsoft Graph PowerShell
Connect-MgGraph -Scopes "Group.ReadWrite.All"

# Create the security group
$group = New-MgGroup -DisplayName "Executive Assistants - Room Dashboard" `
    -Description "Members can view and manage conference room bookings via the Room Dashboard" `
    -MailEnabled:$false `
    -MailNickname "ea-room-dashboard" `
    -SecurityEnabled:$true

# Record the group Object ID
$group.Id
```

**Copy the group Object ID** — this goes in `ALLOWED_GROUP_ID`.

### Step 3.2: Add Members

```powershell
# Add individual EAs
$userId = (Get-MgUser -Filter "userPrincipalName eq 'jane.doe@caireinc.com'").Id
New-MgGroupMember -GroupId $group.Id -DirectoryObjectId $userId

# Or add multiple EAs from a list
$eaEmails = @(
    "jane.doe@caireinc.com",
    "john.smith@caireinc.com",
    "mary.jones@caireinc.com"
)

foreach ($email in $eaEmails) {
    $user = Get-MgUser -Filter "userPrincipalName eq '$email'"
    if ($user) {
        New-MgGroupMember -GroupId $group.Id -DirectoryObjectId $user.Id
        Write-Verbose "Added $email" -Verbose
    } else {
        Write-Warning "User not found: $email"
    }
}

# Verify members
Get-MgGroupMember -GroupId $group.Id | ForEach-Object {
    Get-MgUser -UserId $_.Id | Select-Object DisplayName, UserPrincipalName
}
```

### Step 3.3: Assign the Group to the App

1. Go to **Entra ID** → **Enterprise applications** → **Caire Room Dashboard**
2. **Users and groups** → **Add user/group**
3. Select the **Executive Assistants - Room Dashboard** group
4. Click **Assign**

Optionally, enforce assignment:
1. **Properties** → Set **Assignment required?** to **Yes**
2. This means only users in the assigned group can sign in at all

---

## 4. Configure Environment Variables

### Step 4.1: Generate NEXTAUTH_SECRET

```bash
# Generate a random 32-byte secret
openssl rand -base64 32
```

Or in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### Step 4.2: Create .env.local

```bash
cd caire-room-dashboard
cp .env.local.example .env.local
```

Fill in all values:

```env
# Server-side only (never exposed to browser)
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret-value
NEXTAUTH_SECRET=your-generated-secret
ALLOWED_GROUP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Client-side (exposed to browser — safe, these are public IDs)
NEXT_PUBLIC_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**CRITICAL:** `AZURE_TENANT_ID` and `NEXT_PUBLIC_AZURE_TENANT_ID` must be the same value. Same for the client ID pair.

### Step 4.3: Validate Config

```bash
# Quick sanity check — all vars are set
node -e "
  const required = [
    'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET',
    'NEXTAUTH_SECRET', 'ALLOWED_GROUP_ID',
    'NEXT_PUBLIC_AZURE_TENANT_ID', 'NEXT_PUBLIC_AZURE_CLIENT_ID'
  ];
  const missing = required.filter(k => !process.env[k] || process.env[k].includes('your-'));
  if (missing.length) {
    console.error('MISSING or placeholder env vars:', missing.join(', '));
    process.exit(1);
  }
  console.log('All environment variables configured.');
"
```

---

## 5. Local Validation

Before deploying anywhere, verify the app works locally against your real M365 tenant.

### Step 5.1: Build and Start

```bash
cd caire-room-dashboard
npm install
npm run build
npm start
```

The app should be running at `http://localhost:3000`.

### Step 5.2: Test SSO Login

1. Open `http://localhost:3000` in a browser
2. You should be redirected to `/login`
3. Click **Sign in with Microsoft**
4. Authenticate with a user who is in the EA security group
5. After redirect, you should see the dashboard with the room sidebar populated

### Step 5.3: Test Room Data

Open the browser DevTools → Network tab and verify:

```
GET /api/rooms → 200 OK
Response: { "groups": [...], "totalCount": N }
```

If you see rooms, the Graph API connection is working.

### Step 5.4: Test Calendar Data

After rooms load, check:

```
GET /api/rooms/{room-email}/calendar?startDate=...&endDate=... → 200 OK
Response: { "events": [...] }
```

### Step 5.5: Test Quick-Book (Non-Destructive)

1. Click an empty slot on the timeline
2. Enter a subject like "TEST - Dashboard Booking"
3. Click **Book Room**
4. Verify the booking appears on the timeline
5. **Clean up:** Open Outlook, find the test booking, and delete it

### Step 5.6: Test Cancel (Use a Test Meeting)

1. Create a test meeting in Outlook that books a conference room
2. Find it on the dashboard timeline
3. Click it → Click **Free Room Only** (less destructive than full cancel)
4. Verify the room is freed

---

## 6. Deployment Options

### Option A: Vercel

Best for: quick deployment, automatic HTTPS, zero infrastructure management.

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from the project directory
cd caire-room-dashboard
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: caire-room-dashboard
# - Framework: Next.js (auto-detected)
# - Root directory: ./
```

#### Set Environment Variables in Vercel

```bash
# Set each variable (production environment)
vercel env add AZURE_TENANT_ID production
vercel env add AZURE_CLIENT_ID production
vercel env add AZURE_CLIENT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add ALLOWED_GROUP_ID production
vercel env add NEXT_PUBLIC_AZURE_TENANT_ID production
vercel env add NEXT_PUBLIC_AZURE_CLIENT_ID production
```

Or set them in the Vercel dashboard: **Project Settings** → **Environment Variables**.

#### Deploy to Production

```bash
vercel --prod
```

#### Custom Domain

```bash
vercel domains add rooms.caireinc.com
```

Then add the CNAME record in your DNS:
```
rooms.caireinc.com → cname.vercel-dns.com
```

---

### Option B: Self-Hosted (IIS / Node.js on Windows Server)

Best for: on-prem requirements, existing Windows Server infrastructure.

#### Step B.1: Build the Production Bundle

```bash
cd caire-room-dashboard
npm ci --production=false
npm run build
```

This creates the `.next/` output directory.

#### Step B.2: Install on the Server

Copy these to the server:

```
caire-room-dashboard/
├── .next/                 # Build output
├── node_modules/          # Dependencies (or run npm ci on server)
├── public/                # Static assets
├── package.json
├── package-lock.json
└── .env.local             # Environment variables (CREATE ON SERVER)
```

Or better — clone and build on the server:

```powershell
# On the Windows Server
cd C:\Apps
git clone https://github.com/FusedIcer8/caire-room-dashboard.git
cd caire-room-dashboard
npm ci
# Create .env.local with production values
npm run build
```

#### Step B.3: Run with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start npm --name "room-dashboard" -- start

# Ensure it starts on boot
pm2 save
pm2 startup
```

The app runs on port 3000 by default. Change with:

```bash
pm2 start npm --name "room-dashboard" -- start -- -p 8080
```

#### Step B.4: IIS Reverse Proxy (Optional)

If you need IIS in front of Node.js:

1. Install **URL Rewrite** and **Application Request Routing (ARR)** modules
2. Enable ARR proxy: IIS Manager → Server → Application Request Routing → Server Proxy Settings → Enable proxy
3. Create a new site with this `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

4. Bind the IIS site to `rooms.caireinc.com` with an SSL certificate

#### Step B.5: Windows Service Alternative (NSSM)

If you prefer a Windows service over PM2:

```powershell
# Download NSSM (Non-Sucking Service Manager)
# https://nssm.cc/download

# Install as a service
nssm install CaireRoomDashboard "C:\Program Files\nodejs\node.exe"
nssm set CaireRoomDashboard AppParameters "C:\Apps\caire-room-dashboard\node_modules\.bin\next start"
nssm set CaireRoomDashboard AppDirectory "C:\Apps\caire-room-dashboard"
nssm set CaireRoomDashboard AppEnvironmentExtra "NODE_ENV=production"
nssm set CaireRoomDashboard DisplayName "Caire Room Dashboard"
nssm set CaireRoomDashboard Description "Conference room management dashboard"
nssm set CaireRoomDashboard Start SERVICE_AUTO_START

# Start the service
nssm start CaireRoomDashboard

# Verify
nssm status CaireRoomDashboard
```

---

### Option C: Docker

Best for: containerized environments, consistent deployments.

#### Step C.1: Create Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Step C.2: Enable Standalone Output

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

#### Step C.3: Build and Run

```bash
# Build the image
docker build -t caire-room-dashboard .

# Run with env vars
docker run -d \
  --name room-dashboard \
  -p 3000:3000 \
  -e AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e AZURE_CLIENT_SECRET=your-secret \
  -e NEXTAUTH_SECRET=your-secret \
  -e ALLOWED_GROUP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e NEXT_PUBLIC_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  caire-room-dashboard
```

#### Step C.4: Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/login"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
docker compose up -d
```

---

## 7. Post-Deployment Verification

Run through this checklist after deploying to production:

### Automated Smoke Test

```bash
# Set your production URL
PROD_URL="https://rooms.caireinc.com"

# 1. Login page loads
curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/login"
# Expected: 200

# 2. API rooms endpoint responds (will 500 without auth, but confirms route exists)
curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/rooms"
# Expected: 200 or 500 (not 404)

# 3. Static assets load
curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/_next/static/css/$(ls .next/static/css/ | head -1)" 2>/dev/null
# Expected: 200
```

### Manual Verification Checklist

- [ ] **SSO Login:** Navigate to production URL → redirected to Microsoft login → authenticate → see dashboard
- [ ] **Unauthorized user test:** Have a non-EA user try to login → they should see a 403 or be denied
- [ ] **Room list loads:** Sidebar shows rooms grouped by building
- [ ] **Timeline shows bookings:** Existing meetings appear as colored blocks
- [ ] **NOW marker visible:** Yellow line at current time
- [ ] **Click a booking:** Detail panel opens with organizer, attendees, status
- [ ] **Quick-book works:** Click empty slot → fill subject → book → booking appears
- [ ] **Free Room works:** Click a test booking → Free Room Only → room freed
- [ ] **Cancel works:** Click a test booking → Cancel Entire Meeting → meeting removed
- [ ] **View toggle works:** Switch between Timeline / Daily / Weekly
- [ ] **Toast notifications appear:** After booking/cancelling

### Verify Audit Logs

After performing actions, check the server logs:

```bash
# PM2
pm2 logs room-dashboard --lines 50 | grep "audit"

# Docker
docker logs room-dashboard 2>&1 | grep "audit"

# If using pino-pretty
npm install -g pino-pretty
pm2 logs room-dashboard --lines 50 | pino-pretty
```

You should see structured JSON entries like:

```json
{
  "level": 30,
  "msg": "audit",
  "action": "quick_book",
  "actor": { "email": "jane.doe@caireinc.com" },
  "target": { "room": "Boardroom A", "subject": "Test Booking" },
  "result": "success"
}
```

---

## 8. DNS & SSL

### Internal DNS (for on-prem)

Add a DNS A record or CNAME in your internal DNS:

```
rooms.caireinc.com → <server IP or load balancer>
```

### SSL Certificate

**Option 1: Internal CA (on-prem)**

```powershell
# Request a cert from your internal CA
# Then bind in IIS or configure in your reverse proxy
```

**Option 2: Let's Encrypt (public-facing)**

```bash
# Using certbot
sudo certbot certonly --standalone -d rooms.caireinc.com
```

**Option 3: Vercel (automatic)**

Vercel handles SSL automatically when you add a custom domain.

### Update Entra ID Redirect URI

After setting up your production domain, go back to the app registration:

1. **Authentication** → **Redirect URIs**
2. Add: `https://rooms.caireinc.com`
3. Remove `http://localhost:3000` if no longer needed for dev

---

## 9. Monitoring & Audit Logs

### Log Rotation (Self-Hosted)

If running with PM2, configure log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### Health Check Endpoint

For uptime monitoring, add a simple health check. Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

Monitor with:

```bash
# Cron job or monitoring tool
curl -sf https://rooms.caireinc.com/api/health || echo "DASHBOARD DOWN" | mail -s "Alert" admin@caireinc.com
```

### Future: Azure Application Insights

When ready to upgrade from file-based logging:

```bash
npm install applicationinsights
```

Then update `src/lib/audit-logger.ts` to send telemetry to Application Insights in addition to pino.

---

## 10. Rollback Procedure

### Quick Rollback (Git-based)

```bash
# On the server
cd /path/to/caire-room-dashboard

# Find the last known good commit
git log --oneline -10

# Roll back to a specific commit
git checkout <commit-sha>
npm ci
npm run build

# Restart
pm2 restart room-dashboard
# or
docker compose down && docker compose up -d --build
```

### Vercel Rollback

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel rollback
```

---

## 11. Troubleshooting

### "Failed to fetch rooms" — API returns 500

**Cause:** Graph API authentication failure.

```bash
# Test Graph API access directly
curl -X POST "https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token" \
  -d "client_id=$AZURE_CLIENT_ID" \
  -d "client_secret=$AZURE_CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

If this returns a token, the credentials are valid. If it returns an error:
- Verify `AZURE_CLIENT_SECRET` hasn't expired
- Verify `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` are correct
- Check that admin consent was granted for the API permissions

### "No rooms loaded" — Sidebar is empty

**Cause:** `Place.Read.All` permission not granted or no room mailboxes exist.

```powershell
# Verify rooms exist in Exchange
Get-Mailbox -RecipientTypeDetails RoomMailbox | Measure-Object
```

If rooms exist but don't show up, check the Graph API directly:

```bash
TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token" \
  -d "client_id=$AZURE_CLIENT_ID&client_secret=$AZURE_CLIENT_SECRET&scope=https://graph.microsoft.com/.default&grant_type=client_credentials" \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/places/microsoft.graph.room"
```

### "MSAL: window is not defined" during build

**This is expected and harmless.** MSAL's browser detection fires during Next.js static page generation (SSR). The app guards against this — the error is logged but doesn't affect functionality.

### SSO login redirects but then shows blank page

**Cause:** Redirect URI mismatch.

1. Check the browser URL after redirect — it should match one of your registered redirect URIs exactly
2. Go to Entra ID → App Registration → Authentication → Redirect URIs
3. Make sure the production URL is listed (including `https://` and no trailing slash)

### Cancel/Decline fails with 403

**Cause:** The app's `Calendars.ReadWrite` permission may not cover the organizer's mailbox.

With application permissions and admin consent, `Calendars.ReadWrite` should work on all mailboxes in the tenant. If it doesn't:

1. Verify the permission shows as "Granted" (not just "Requested") in the app registration
2. Re-grant admin consent
3. Wait 5-10 minutes for permission propagation

### Client secret expiry

Client secrets expire. When they do, the app will fail to acquire tokens.

```powershell
# Check secret expiry
Connect-MgGraph -Scopes "Application.Read.All"
$app = Get-MgApplication -Filter "displayName eq 'Caire Room Dashboard'"
$app.PasswordCredentials | Select-Object DisplayName, EndDateTime | Format-Table
```

To rotate:
1. Create a new secret in the app registration
2. Update `AZURE_CLIENT_SECRET` in your deployment
3. Restart the app
4. Delete the old secret after confirming the new one works

---

## Quick Reference Card

| Item | Value |
|------|-------|
| **Repo** | https://github.com/FusedIcer8/caire-room-dashboard |
| **Stack** | Next.js 16, TypeScript, Tailwind v4, MSAL, Graph API |
| **Default Port** | 3000 |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Test Command** | `npm test` |
| **Env Template** | `.env.local.example` |
| **Graph Permissions** | `Place.Read.All`, `Calendars.ReadWrite` (Application) |
| **Auth** | Entra ID SSO (SPA redirect) + Client Credentials (backend) |
| **Audit Logs** | Structured JSON via pino (stdout) |
