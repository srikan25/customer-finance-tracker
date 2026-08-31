# Customer Finance Tracker

Customer Finance Tracker is a React-based finance management application designed to help manage customer loans, EMI schedules, payments, and outstanding balances in one place.

The application was developed to simplify finance record management by replacing manual records with a structured digital system. Each authenticated user has access only to their own customer and finance data.

## Features

### Customer Management

* Add new customers
* View customer details
* Edit existing customer information
* Delete customer records
* Store customer information including:

  * Name
  * Mobile Number
  * Aadhaar Number
  * Address

### Aadhaar Privacy

Customer Aadhaar numbers are masked by default to protect sensitive information.

Example:

`XXXX XXXX 1234`

Users can temporarily reveal the complete Aadhaar number using the visibility option. The number is automatically masked again when the user clicks outside the field.

### Finance Management

Finance details can be maintained separately for each customer.

The system tracks information such as:

* Vehicle Name
* Total Amount
* Down Payment
* Finance Amount
* Document Charges
* Interest Rate
* Total EMIs
* EMI Amount
* Paid EMIs
* Remaining EMIs
* Total EMI Paid
* Remaining Balance

### EMI Schedule

The application provides a date-wise EMI schedule for each finance account.

Each EMI can display its current status, such as:

* Paid
* Due Tomorrow
* Upcoming

This helps users quickly understand upcoming and completed payments.

### Payment Tracking

Payments can be recorded against customer finance accounts.

When a payment is recorded, the application updates related finance information including:

* Paid EMIs
* Remaining EMIs
* Total EMI Paid
* Remaining Balance
* EMI payment status

Users can also view payment history for a customer.

### EMI Alerts

The application identifies upcoming EMI due dates and can indicate when an EMI is due the following day.

This helps users keep track of approaching payment dates.

### Closed Accounts

Completed finance accounts can be maintained separately under Closed Accounts.

This allows active and completed customer finance records to remain organized.

### Authentication

Authentication is implemented using Supabase.

The application includes:

* User Sign Up
* User Login
* User Logout
* Protected application access
* Change password functionality

### User Data Security

Each authenticated user's data is kept separate.

Customer, finance, EMI, and payment records are associated with the authenticated user.

Supabase Row Level Security (RLS) is used to restrict access so users can access only records that belong to their own account.

### Responsive Interface

The application is designed to work across desktop and mobile screen sizes with a simple and accessible user interface.

## Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Vite

### Backend & Services

* Supabase Authentication
* Supabase Database
* Supabase Row Level Security (RLS)

### Tools

* Git
* GitHub
* VS Code

## Screenshots

Screenshots of the application interface can be added here.

Suggested views:

* Customer Dashboard
* Add Customer
* Finance / EMI Details
* Payment History

## Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd YOUR_PROJECT_FOLDER
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root and add the required Supabase environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not commit the `.env` file or expose private credentials in the repository.

### 5. Start the Development Server

```bash
npm run dev
```

## Future Improvements

* Enhanced EMI reminders and notifications
* Search and filtering for customer records
* Additional finance reports and summaries
* Improved dashboard analytics
* Export and reporting options

## Author

**Kotla Srikanth**

Frontend Developer | React.js

GitHub: github.com/srikan25
