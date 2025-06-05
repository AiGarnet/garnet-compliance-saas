# 🌐 Deployment Guide – Custom Domain on Netlify (with GoDaddy)

## ✅ Overview

This guide documents the steps taken to connect a custom domain (`garnetai.net`) purchased from GoDaddy to a project hosted on **Netlify**, including DNS configuration, HTTPS setup, and troubleshooting notes.

---

## 🔧 DNS Configuration (GoDaddy)

| Type   | Name | Value                              | TTL     |
|--------|------|-------------------------------------|---------|
| **A**  | `@`  | `75.2.60.5`                         | 1 Hour  |
| **A**  | `@`  | `99.83.190.102`                     | 1 Hour  |
| **CNAME** | `www` | `testinggarnet.netlify.app.`       | 1 Hour  |
| **NS** | `@`  | `ns33.domaincontrol.com.` *(Default)* | Can't edit |
| **NS** | `@`  | `ns34.domaincontrol.com.` *(Default)* | Can't edit |
| **SOA**| `@`  | `Primary nameserver: ns33.domaincontrol.com.` | 1 Hour |

> **Note:** These are the official Netlify DNS A-records for apex/root domains.

---

## 🛠 Netlify Configuration

- **Project Subdomain:** `testinggarnet.netlify.app`
- **Primary Domain (Recommended):** `www.garnetai.net`
- **Root Domain (`garnetai.net`):** Configured to **redirect automatically** to `www.garnetai.net`

---

## 🔒 SSL/TLS Certificate

- **Provider:** Let’s Encrypt (auto-managed by Netlify)
- **Domains Covered:** `www.garnetai.net`, `garnetai.net`
- **Certificate Status:** ✅ Provisioned and active
- **Created:** 5 June 2025
- **Auto-Renews Before:** 2 September 2025
- **Initial Provisioning Time:** 5–30 minutes

---

## ❗ Troubleshooting Notes

### ✅ Expected Delays

- **DNS Propagation:** Can take up to **24–48 hours** globally.
- **SSL Provisioning:** Let’s Encrypt certificates may take **5–30 minutes** to activate.

### ⚠️ Brave Browser – SSL Error

If Brave shows `ERR_SSL_PROTOCOL_ERROR`:

1. Open Brave: `brave://net-internals/#hsts`
2. Under "Delete domain security policies", enter: `garnetai.net`
3. Click **Delete**
4. Clear browser cache or try incognito mode

### 🔄 AWS Global Accelerator IP Delay

Netlify uses multiple IPs (via AWS Global Accelerator). Occasionally, one IP might fail SSL checks temporarily.

- **Example:** `75.2.60.5` passed (A+), but `99.83.190.102` failed briefly
- **Action:** No need to change anything — just allow time for full propagation

---

## 📌 Recommendations

- Keep `www.garnetai.net` as the **primary domain**
- Redirect `garnetai.net` to `www.garnetai.net`
- Avoid editing DNS during provisioning
- For advanced users: consider using **Netlify DNS** for direct domain control

---

