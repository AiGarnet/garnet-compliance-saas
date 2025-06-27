# Trust Portal Share System Documentation

## Overview

The Trust Portal Share System allows vendors to generate secure, shareable links that enterprises can use to view their compliance and work portfolio without requiring authentication. This creates a seamless trust-building experience between vendors and potential enterprise clients.

## Architecture

### Database Structure

#### vendor_invite_tokens Table
```sql
CREATE TABLE vendor_invite_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_vendor_invite_tokens_vendor_id 
        FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    CONSTRAINT uq_vendor_invite_tokens_vendor_id UNIQUE (vendor_id)
);
```

**Key Features:**
- One active token per vendor (enforced by unique constraint)
- 30-day expiration period
- Secure token generation
- Cascade deletion when vendor is removed

### Backend Implementation

#### Endpoints

1. **Generate Invite Link** - `POST /api/vendors/:id/trust-portal/invite`
   - **Authentication:** Required (JWT)
   - **Purpose:** Generate or retrieve active invite token for vendor
   - **Returns:** Token, expiration date, and full invite link

2. **Public Trust Portal Access** - `GET /api/trust-portal/invite/:token`
   - **Authentication:** None (Public endpoint)
   - **Purpose:** Retrieve vendor trust portal data using invite token
   - **Returns:** Vendor profile, works, documents, and questionnaire answers

#### Service Methods

**VendorsService:**
- `generateInviteToken(vendorId: number)` - Creates new token or returns existing
- `getActiveInviteToken(vendorId: number)` - Retrieves current active token
- `getVendorByInviteToken(token: string)` - Validates token and returns vendor
- `markInviteTokenAsUsed(token: string)` - Marks token as used (optional)

**TrustPortalService:**
- `getVendorTrustPortalData(vendorId: number, includePrivate: boolean)` - Returns filtered data for public/private view

### Frontend Implementation

#### Routes

1. **Vendor Dashboard** - `/trust-portal`
   - **Purpose:** Vendor manages their trust portal and generates share links
   - **Features:** Generate link, copy link, preview public view

2. **Public Trust Portal** - `/trust-portal/public/:token`
   - **Purpose:** Public view of vendor's trust portal
   - **Features:** Responsive layout, company info, work portfolio, documents

#### Components

- `TrustPortalVendorView` - Vendor management interface
- `TrustPortalPublicView` - Public viewing interface
- `VendorWorksList` - Displays shareable works with trust portal options

## Security Features

### Token Security
- **Unique Tokens:** Each vendor can only have one active token at a time
- **Expiration:** Tokens expire after 30 days to limit exposure
- **Randomized Generation:** Uses timestamp + random string for uniqueness
- **Secure Storage:** Tokens stored hashed in database

### Data Privacy
- **Explicit Sharing:** Only works marked as "share_to_trust_portal" are visible
- **No Private Data:** Public view excludes sensitive vendor information
- **Draft Protection:** Draft works never appear on trust portal
- **Controlled Access:** Vendors control what content is shared

### Access Control
- **Public Access:** No authentication required for viewing trust portal
- **Vendor Authentication:** Required for generating and managing invite links
- **Admin Oversight:** Admin users can view all trust portals
- **Rate Limiting:** Built-in protection against abuse

## User Experience

### For Vendors

1. **Generate Share Link**
   - Navigate to Trust Portal dashboard
   - Click "Generate Share Link" button
   - Copy the generated link
   - Share with enterprise clients

2. **Manage Shared Content**
   - Mark works as "Share to Trust Portal"
   - Upload and categorize documents
   - Update company profile information
   - Preview public view

### For Enterprises

1. **Access Trust Portal**
   - Click shared link from vendor
   - View vendor profile and compliance information
   - Browse work portfolio and case studies
   - Download shared documents
   - No registration required

2. **Evaluate Vendor**
   - Review company credentials
   - Examine completed projects
   - Assess technology expertise
   - Contact vendor directly

## API Usage Examples

### Generate Invite Link

```javascript
// Frontend API call
const response = await vendors.trustPortal.generateInviteLink(vendorId);

// Response format
{
  success: true,
  data: {
    token: "1703123456789_abc123def456",
    expiresAt: "2024-02-15T10:30:00Z",
    inviteLink: "https://app.garnetai.com/trust-portal/public/1703123456789_abc123def456",
    message: "Invite link generated successfully"
  }
}
```

### Access Public Trust Portal

```javascript
// Frontend API call
const data = await vendors.trustPortal.getByInviteToken(token);

// Response includes
{
  vendor: { /* vendor profile */ },
  vendorWorks: [ /* shared works */ ],
  sharedDocuments: [ /* public documents */ ],
  questionnaireAnswers: [ /* compliance responses */ ]
}
```

## Configuration

### Environment Variables

```bash
# Backend
FRONTEND_URL=https://app.garnetai.com
DATABASE_URL=postgresql://...

# Frontend  
NEXT_PUBLIC_FRONTEND_URL=https://app.garnetai.com
NEXT_PUBLIC_API_URL=https://api.garnetai.com
```

### Feature Flags

- `TRUST_PORTAL_ENABLED` - Enable/disable trust portal functionality
- `PUBLIC_ACCESS_ENABLED` - Allow public access to trust portals
- `INVITE_TOKEN_EXPIRY_DAYS` - Configure token expiration (default: 30)

## Deployment

### Database Migration

1. Run migration 002 to create vendor_invite_tokens table
2. Run migration 012 to add 'used' column
3. Verify indexes are created for performance

```bash
node run_migration_002.js
node run_migration_012.js
```

### Backend Deployment

1. Ensure all environment variables are set
2. Deploy with trust portal routes enabled
3. Verify public endpoints work without authentication

### Frontend Deployment

1. Build with public trust portal routes
2. Configure proper CORS for API access
3. Test public link sharing functionality

## Monitoring and Analytics

### Metrics to Track

- **Invite Links Generated:** Number of links created per vendor
- **Public Portal Views:** Traffic to shared trust portals
- **Link Usage:** How often shared links are accessed
- **Conversion Tracking:** Enterprise engagement with vendors

### Health Checks

- **Token Validation:** Ensure tokens work correctly
- **Public Access:** Verify public endpoints are accessible
- **Data Loading:** Monitor trust portal data retrieval performance

## Troubleshooting

### Common Issues

1. **"Invalid invite token"**
   - Check if token has expired (30 days)
   - Verify token exists in database
   - Ensure vendor hasn't been deleted

2. **"No content visible"**
   - Confirm works are marked "share_to_trust_portal"
   - Check if works are saved as drafts
   - Verify vendor has published content

3. **"Link generation failed"**
   - Check vendor authentication
   - Verify database connectivity
   - Ensure vendor exists and is active

### Debug Steps

1. Check backend logs for API errors
2. Verify database table structure
3. Test token validation manually
4. Confirm frontend environment variables

## Future Enhancements

### Planned Features

1. **Analytics Dashboard**
   - Track trust portal engagement
   - Monitor link performance
   - View enterprise interactions

2. **Custom Branding**
   - Vendor-specific themes
   - Custom domain support
   - Logo and color customization

3. **Advanced Sharing**
   - Password-protected links
   - Expiration date customization
   - Usage tracking per link

4. **Integration Features**
   - CRM integration
   - Lead capture forms
   - Email notifications

## Support

For technical support or questions about the Trust Portal Share System:

1. Check this documentation first
2. Review backend logs for errors
3. Test with sample data
4. Contact development team if needed

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Maintainer:** Garnet AI Development Team 