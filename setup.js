#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Personal Finance Management System Setup');
console.log('==========================================\n');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Backend .env content
const backendEnvContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_management
JWT_SECRET=${jwtSecret}
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
`;

// Frontend .env content
const frontendEnvContent = `REACT_APP_API_URL=http://localhost:5000
`;

// Create backend .env file
const backendEnvPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created server/.env file');
} else {
  console.log('⚠️  server/.env already exists, skipping...');
}

// Create frontend .env file
const frontendEnvPath = path.join(__dirname, 'client', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created client/.env file');
} else {
  console.log('⚠️  client/.env already exists, skipping...');
}

console.log('\n📋 Setup Instructions:');
console.log('=====================');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Install dependencies: npm run install-all');
console.log('3. Start the application: npm run dev');
console.log('4. Visit http://localhost:3000 to access the application');
console.log('\n🔧 Optional Configuration:');
console.log('- Update API keys in server/.env for live stock/gold prices');
console.log('- Configure email settings for notifications');
console.log('\n📚 For more information, see README.md');
