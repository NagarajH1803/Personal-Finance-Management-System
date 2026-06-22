# Personal Finance Management System

A comprehensive full-stack application for managing personal finances, including EMIs, assets, investments, and financial planning.

## 🚀 Features

### 🔐 Authentication & User Management
- Secure JWT-based authentication
- Role-based access control (User, Admin)
- Password encryption with bcrypt
- User profile management

### 💰 Finance Modules

#### EMI Management
- Add/edit EMI details (loan amount, interest rate, tenure, EMI date)
- Automatic EMI calculator with schedule generation
- EMI due reminders and notifications
- Multiple loan types support (Home, Car, Personal, Business, Education)

#### Assets Management
- Track real estate, vehicles, and other assets
- Automatic depreciation calculator
- Asset value updates over time
- Maintenance cost tracking

#### Rent Management
- Record monthly rent expenses/income
- Track rental agreements and due dates
- Property management with tenant/landlord details

#### Stocks & Investments
- Track stock portfolio with buy/sell transactions
- Live stock price integration (Yahoo Finance API)
- Profit/loss calculations and performance charts
- Portfolio analytics

#### Fixed Deposits (FDs)
- Add FD details with automatic maturity calculations
- Interest rate and maturity tracking
- Premature withdrawal penalty calculations

#### Gold Investments
- Track gold holdings (grams, purchase price, current price)
- Live gold rate integration
- Purity and location tracking

#### Income Tax Return (ITR)
- Store annual income and expenses
- Automatic tax calculations
- Generate ITR summary reports
- PDF export functionality

### 📊 Reporting & Dashboard
- Comprehensive financial overview
- Net worth tracking
- Asset allocation charts
- Monthly and yearly reports
- Performance analytics

### ⚙️ Technical Features
- PDF export of financial reports
- Email notifications for reminders
- Audit log of user transactions
- Responsive design for all devices

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **Axios** - HTTP client for external APIs

### Frontend
- **React** - UI library
- **TailwindCSS** - Styling framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **React Toastify** - Notifications
- **Headless UI** - Accessible UI components

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd personal-finance-management
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env)
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development

# API Keys (Optional - for live data)
YAHOO_FINANCE_API_KEY=your_yahoo_finance_api_key
GOLD_API_KEY=your_gold_api_key

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

#### Frontend Environment (.env)
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup
Make sure MongoDB is running on your system:

```bash
# Start MongoDB (if not running as a service)
mongod
```

### 5. Run the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

#### Production Mode
```bash
# Build the frontend
cd client
npm run build

# Start the backend
cd ../server
npm start
```

## 📱 Usage

### 1. Registration/Login
- Visit `http://localhost:3000`
- Create a new account or login with existing credentials

### 2. Dashboard Overview
- View your financial summary
- Check net worth, assets, and liabilities
- Monitor upcoming payments and investments

### 3. Managing EMIs
- Add new EMI details
- View EMI schedule and calculations
- Set up reminders for due dates

### 4. Asset Tracking
- Add real estate, vehicles, and other assets
- Track depreciation and current values
- Record maintenance costs

### 5. Investment Management
- Add stocks with live price updates
- Track gold investments
- Manage fixed deposits

### 6. Rent Management
- Record rental income/expenses
- Track agreement details
- Monitor due dates

### 7. ITR Management
- Enter income and deduction details
- Generate tax calculations
- Export reports to PDF

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### EMI Management
- `GET /api/emi` - Get all EMIs
- `POST /api/emi` - Create new EMI
- `PUT /api/emi/:id` - Update EMI
- `DELETE /api/emi/:id` - Delete EMI
- `GET /api/emi/:id/schedule` - Get EMI schedule

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Stocks
- `GET /api/stocks` - Get all stocks
- `POST /api/stocks` - Create new stock
- `POST /api/stocks/:id/transaction` - Add transaction
- `GET /api/stocks/price/:symbol` - Get live price

### Dashboard
- `GET /api/dashboard/overview` - Get financial overview
- `GET /api/dashboard/cashflow` - Get cash flow data
- `GET /api/dashboard/upcoming` - Get upcoming payments
- `GET /api/dashboard/performance` - Get performance data

## 🔒 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 📊 Data Visualization

The application includes various charts and visualizations:

- Asset allocation pie charts
- Investment performance line charts
- Cash flow bar charts
- EMI schedule tables

## 🔔 Notifications

- EMI due reminders
- Rent payment alerts
- FD maturity notifications
- Investment updates

## 📄 PDF Export

- ITR summary reports
- Financial statements
- Investment portfolios
- EMI schedules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- Mobile app development
- Advanced analytics and AI insights
- Integration with banking APIs
- Multi-currency support
- Goal-based financial planning
- Tax optimization suggestions

---

**Note**: This is a comprehensive personal finance management system designed for educational and personal use. For production deployment, ensure proper security measures and data backup strategies are in place.
