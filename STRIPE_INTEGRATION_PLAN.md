# Stripe Integration Plan - Alessandra Zanetti

**Business:** Home Design, Interior Decoration, Home Staging, Objects & Handcrafts Sales  
**Status:** Payment Processing Implemented | Invoicing & Tax System Needed  
**Stripe Products:** Payments ✅ | Invoicing ⏳ | Tax ⏳

---

## 📊 Current State

### ✅ Already Implemented
- **Payments:** Stripe payment processing (test mode) with order confirmation emails
- **Backend Integration:** Express.js routes `/api/stripe/confirm` for payment handling
- **Frontend Checkout:** 3-step checkout with cart, address, payment
- **Email Confirmation:** Mailgun integration sending order details to customer
- **Order Tracking:** Customer-facing tracking page with status timeline
- **Financial Dashboard:** Admin dashboard with revenue metrics, regional split, tax breakdown
- **Multi-Region Support:** Brazil (BRL) + Europe (EUR) with regional tax calculation (18% Brazil, 23% Portugal, 21% EU)

### ⏳ Needs Implementation
- **Invoicing System:** Generate professional invoices for customers after payment
- **Stripe Tax:** Automated tax calculation and compliance reporting
- **Webhook Handling:** Asynchronous payment confirmation via Stripe webhooks
- **Expense Tracking:** Admin can log expenses and see profit margin tracking
- **Invoice Management:** Admin interface to generate, download, email invoices to customers

---

## 🎯 Integration Roadmap

### PHASE 1: Setup & Configuration (TODAY)
**Time:** ~1 hour

1. **Create Stripe Account in Portugal** (Canario Diafano)
   - Follow STRIPE_SETUP_GUIDE.md
   - Obtain API keys: `pk_test_*` and `sk_test_*`
   - Verify test mode is active

2. **Update Environment Variables**
   ```bash
   STRIPE_PUBLIC_KEY=pk_test_your_key_here
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_test_your_secret
   ```

3. **Test Current Payment Flow**
   - Start backend & frontend
   - Add product to cart
   - Complete checkout with test card `4242 4242 4242 4242`
   - Verify email arrives in filardiferreira@gmail.com
   - Verify order appears in admin dashboard

---

### PHASE 2: Invoicing System (NEXT)
**Time:** ~2-3 hours

#### 2.1 Backend: Invoice Service
Create `backend/services/invoiceService.js`:
```javascript
- generateInvoice(orderId, orderData)
  - Creates PDF invoice with order details
  - Company info: Canario Diafano (PT)
  - Tax breakdown by region
  - Due date (30 days)
  - Payment terms
  
- sendInvoiceEmail(customerEmail, invoicePDF)
  - Uses Mailgun to send invoice as PDF attachment
  - Professional template
  
- listInvoices(filters)
  - Return invoices by date range, customer, status
```

#### 2.2 Backend: Invoice Routes
`backend/routes/invoices.js`:
```
POST   /api/invoices/:orderId        - Generate invoice from order
GET    /api/invoices                 - List all invoices (admin)
GET    /api/invoices/:invoiceId     - Get invoice details
GET    /api/invoices/:invoiceId/pdf - Download invoice PDF
POST   /api/invoices/:invoiceId/email - Send invoice to customer
```

#### 2.3 Frontend: Invoice Management
`frontend/src/pages/InvoiceManager.jsx`:
- List all invoices with filters (date, customer, status)
- View invoice details
- Download as PDF
- Email to customer
- Regenerate invoice if needed

#### 2.4 Database: Invoice Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  invoice_date TIMESTAMP,
  due_date TIMESTAMP,
  amount_subtotal DECIMAL(10,2),
  amount_tax DECIMAL(10,2),
  amount_total DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50), -- 'draft', 'sent', 'paid', 'cancelled'
  pdf_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### PHASE 3: Stripe Tax Integration
**Time:** ~1-2 hours

#### 3.1 Enable Stripe Tax in Dashboard
- Go to https://dashboard.stripe.com/tax/settings
- Enable tax calculation
- Configure tax rates for regions:
  - Brazil: 18% (ICMS)
  - Portugal: 23% (VAT)
  - EU: 21% (VAT - standard)
  - Add specific country rates if needed

#### 3.2 Backend: Use Stripe Tax API
Modify `backend/routes/payment.js`:
```javascript
// Before charging, calculate tax via Stripe
const taxCalculation = await stripe.tax.calculations.create({
  currency: 'eur', // or 'brl'
  customer_details: {
    address: {
      line1: address.street,
      city: address.city,
      postal_code: address.zip,
      country: country_code, // 'BR', 'PT', 'IT', etc.
    },
    email: customerEmail,
    type: 'individual'
  },
  line_items: cartItems.map(item => ({
    amount: item.price * 100, // cents
    reference: item.productId,
    tax_code: 'txcd_10000000' // Physical goods
  })),
  shipping_cost: shippingCost * 100
});

// Store calculation ID for invoice
order.stripe_tax_calculation_id = taxCalculation.id;
```

#### 3.3 Frontend: Display Calculated Tax
Show real-time tax in checkout:
- Subtotal
- **Tax (Stripe calculated):** varies by address
- Shipping
- **Total**

---

### PHASE 4: Webhook Handling
**Time:** ~1 hour

#### 4.1 Webhook Endpoint
Create `backend/routes/webhooks.js`:
```javascript
POST /api/webhooks/stripe

Handles:
- payment_intent.succeeded → Mark order as 'paid', send email
- payment_intent.payment_failed → Mark order as 'failed', notify admin
- charge.refunded → Update order status, generate credit note
- invoice.payment_succeeded → Update invoice status
```

#### 4.2 Webhook Configuration
- Register endpoint in Stripe Dashboard:
  - URL: `https://alessandrazanetti.com/api/webhooks/stripe`
  - Events: `payment_intent.*`, `charge.*`, `invoice.*`
- Add webhook secret to `.env`
- Verify webhook signatures using Stripe SDK

#### 4.3 Production Readiness
- Test webhook locally with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3001/api/webhooks/stripe
  ```
- Monitor webhook delivery in Stripe Dashboard
- Add logging for all webhook events

---

### PHASE 5: Expense Tracking & Profit Analytics
**Time:** ~2 hours

#### 5.1 Backend: Expenses Service
`backend/services/expenseService.js`:
```javascript
- createExpense(type, amount, description, receipt)
  Types: 'shipping', 'product_cost', 'packaging', 'utilities', 'services', 'other'
  
- listExpenses(filters)
  Return by date range, category, amount
  
- calculateProfitMargin(timeRange)
  Revenue - Expenses - Stripe Fees - Taxes
```

#### 5.2 Database: Expenses Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  type VARCHAR(50), -- 'shipping', 'product_cost', etc.
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  description TEXT,
  receipt_url VARCHAR(255),
  invoice_date DATE,
  payment_method VARCHAR(50),
  created_at TIMESTAMP,
  created_by UUID REFERENCES admins(id)
);
```

#### 5.3 Frontend: Expenses Dashboard
`frontend/src/components/ExpenseDashboard.jsx`:
- **Metrics:**
  - Total Revenue (this month / this year)
  - Total Expenses breakdown (by category)
  - Net Profit = Revenue - Expenses - Stripe Fees - Taxes
  - Profit Margin %
  - Cost per order
  
- **Charts:**
  - Monthly revenue vs. expenses (stacked bar chart)
  - Expense breakdown (pie chart)
  - Profit trend (line chart)
  
- **Features:**
  - Add expense form
  - List expenses with filters
  - Download expense report (CSV/PDF)
  - Expense forecast

#### 5.4 Admin Panel Integration
- Add "Finances" tab alongside Dashboard/Products/Orders
- Tab shows: Financial Dashboard + Expenses + Invoices

---

## 🔗 System Architecture

```
Customer Order Flow:
1. Add products → Cart (Zustand store)
2. Enter address → Tax calculated via Stripe API
3. Payment → Stripe payment_intent.create() + confirmation email
4. Success → Webhook payment_intent.succeeded
5. Order marked 'paid' → Invoice auto-generated
6. Customer can download invoice from tracking page
7. Admin can view invoice in Invoice Manager

Financial Reporting:
- Revenue: Sum of all orders
- Taxes: From Stripe Tax API (actual collected)
- Stripe Fees: 2.9% + $0.30 per transaction
- Expenses: Admin-logged expenses
- Net Profit: Revenue - Expenses - Stripe Fees - Taxes
- Margin %: (Net Profit / Revenue) × 100
```

---

## 🚀 Implementation Checklist

### Phase 1: Setup
- [ ] Create Stripe account in Portugal (Canario Diafano)
- [ ] Obtain test API keys
- [ ] Update `.env` with keys
- [ ] Test payment flow end-to-end
- [ ] Verify email confirmation arrives

### Phase 2: Invoicing
- [ ] Create `invoiceService.js`
- [ ] Add invoice routes to Express
- [ ] Create invoices table in PostgreSQL
- [ ] Build InvoiceManager component (admin)
- [ ] Add invoice download/email functionality
- [ ] Test invoice generation and delivery

### Phase 3: Stripe Tax
- [ ] Enable Stripe Tax in dashboard
- [ ] Configure tax rates by country
- [ ] Implement tax calculation in checkout
- [ ] Test tax display with different addresses
- [ ] Verify correct tax is charged

### Phase 4: Webhooks
- [ ] Create webhook endpoint
- [ ] Register webhook URL in Stripe
- [ ] Implement webhook signature verification
- [ ] Handle all event types
- [ ] Test locally with Stripe CLI
- [ ] Monitor production webhooks

### Phase 5: Expenses & Analytics
- [ ] Create expenses table
- [ ] Build ExpenseDashboard component
- [ ] Implement expense logging
- [ ] Calculate profit metrics
- [ ] Create expense report exports
- [ ] Add forecasting (optional)

---

## 📞 Testing Strategy

### Phase 1 Test Cases
1. **Test Payment Success**
   - Card: 4242 4242 4242 4242 (always succeeds)
   - Verify order status → 'paid'
   - Verify email sent to filardiferreira@gmail.com

2. **Test Payment Failure**
   - Card: 4000 0000 0000 0002 (always fails)
   - Verify order status → 'failed'
   - Verify error message to user

### Phase 2 Test Cases
1. Generate invoice from successful order
2. Download invoice PDF
3. Email invoice to customer
4. Verify invoice appears in admin list

### Phase 3 Test Cases
1. Checkout from Brazil → 18% tax
2. Checkout from Portugal → 23% tax
3. Checkout from Germany → 21% tax
4. Verify tax displayed correctly
5. Verify tax included in total

### Phase 4 Test Cases
1. Simulate payment_intent.succeeded webhook
2. Verify order marked 'paid'
3. Verify invoice auto-generated
4. Test webhook retry logic
5. Test webhook signature validation

### Phase 5 Test Cases
1. Add expense → appears in dashboard
2. Profit calculation correct
3. Expense breakdown accurate
4. Monthly trends display correctly

---

## 🛡️ Production Migration

When ready to go live:

1. **API Keys:**
   - Obtain production keys: `pk_live_*` and `sk_live_*`
   - Update `.env` (do NOT commit these)
   - Rotate in Stripe dashboard annually

2. **Testing:**
   - Run full integration test suite
   - Test with real card (small amount)
   - Verify emails send to real customer
   - Monitor Stripe dashboard for anomalies

3. **Compliance:**
   - GDPR: Customer data is stored minimally
   - PCI-DSS: Stripe handles payment data (no storage on servers)
   - Tax: Stripe Tax generates compliance reports
   - GDPR: Add privacy policy mentioning Stripe + Mailgun

4. **Monitoring:**
   - Enable Stripe alerts for failed payments
   - Set up logging for all API calls
   - Monitor webhook delivery
   - Review financial dashboards weekly

---

## 📈 Success Metrics

- ✅ 100% of orders generate invoices
- ✅ Tax accuracy: <0.1% error rate
- ✅ Email delivery rate: >95%
- ✅ Webhook delivery: 100% (with retries)
- ✅ Profit visibility: Admin can see real-time metrics
- ✅ Customer satisfaction: Easy invoice access

---

## 🔗 Resources

- **Stripe API Docs:** https://stripe.com/docs/api
- **Stripe Tax Guide:** https://stripe.com/docs/tax
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhook Events:** https://stripe.com/docs/api/events/types
- **Invoice Library:** `@stripe/stripe-js`, `jsPDF`, `html2pdf.js`

---

**Next Step:** Follow Phase 1 (Setup) using STRIPE_SETUP_GUIDE.md, then start Phase 2 once payment flow is tested.
