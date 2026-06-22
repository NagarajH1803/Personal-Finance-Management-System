const mongoose = require('mongoose');

const itrSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    match: [/^\d{4}-\d{4}$/, 'Financial year must be in format YYYY-YYYY']
  },
  // Income Details
  income: {
    salary: {
      type: Number,
      default: 0
    },
    business: {
      type: Number,
      default: 0
    },
    houseProperty: {
      type: Number,
      default: 0
    },
    capitalGains: {
      type: Number,
      default: 0
    },
    otherSources: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  // Deductions
  deductions: {
    section80C: {
      type: Number,
      default: 0
    },
    section80D: {
      type: Number,
      default: 0
    },
    section80G: {
      type: Number,
      default: 0
    },
    section80TTA: {
      type: Number,
      default: 0
    },
    section80TTB: {
      type: Number,
      default: 0
    },
    hra: {
      type: Number,
      default: 0
    },
    standardDeduction: {
      type: Number,
      default: 50000
    },
    total: {
      type: Number,
      default: 0
    }
  },
  // Tax Calculation
  taxCalculation: {
    grossTotalIncome: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    taxableIncome: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    surcharge: {
      type: Number,
      default: 0
    },
    educationCess: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    }
  },
  // TDS and Advance Tax
  taxesPaid: {
    tds: {
      type: Number,
      default: 0
    },
    advanceTax: {
      type: Number,
      default: 0
    },
    selfAssessmentTax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  // Refund
  refund: {
    amount: {
      type: Number,
      default: 0
    },
    bankAccount: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    }
  },
  // Documents
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'filed', 'verified', 'processed', 'completed'],
    default: 'draft'
  },
  filingDate: Date,
  acknowledgmentNumber: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
itrSchema.pre('save', function(next) {
  // Calculate total income
  this.income.total = this.income.salary + this.income.business + 
                     this.income.houseProperty + this.income.capitalGains + 
                     this.income.otherSources;
  
  // Calculate total deductions
  this.deductions.total = this.deductions.section80C + this.deductions.section80D + 
                         this.deductions.section80G + this.deductions.section80TTA + 
                         this.deductions.section80TTB + this.deductions.hra + 
                         this.deductions.standardDeduction;
  
  // Calculate tax
  this.taxCalculation.grossTotalIncome = this.income.total;
  this.taxCalculation.totalDeductions = this.deductions.total;
  this.taxCalculation.taxableIncome = Math.max(0, this.taxCalculation.grossTotalIncome - this.taxCalculation.totalDeductions);
  
  // Calculate tax amount based on slabs (simplified)
  this.taxCalculation.taxAmount = this.calculateTax(this.taxCalculation.taxableIncome);
  this.taxCalculation.surcharge = this.taxCalculation.taxAmount > 5000000 ? this.taxCalculation.taxAmount * 0.10 : 0;
  this.taxCalculation.educationCess = (this.taxCalculation.taxAmount + this.taxCalculation.surcharge) * 0.04;
  this.taxCalculation.totalTax = this.taxCalculation.taxAmount + this.taxCalculation.surcharge + this.taxCalculation.educationCess;
  
  // Calculate total taxes paid
  this.taxesPaid.total = this.taxesPaid.tds + this.taxesPaid.advanceTax + this.taxesPaid.selfAssessmentTax;
  
  // Calculate refund
  this.refund.amount = Math.max(0, this.taxesPaid.total - this.taxCalculation.totalTax);
  
  next();
});

// Method to calculate tax based on income slabs
itrSchema.methods.calculateTax = function(taxableIncome) {
  let tax = 0;
  
  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = 12500 + (taxableIncome - 500000) * 0.20;
  } else {
    tax = 112500 + (taxableIncome - 1000000) * 0.30;
  }
  
  return tax;
};

// Virtual for tax liability
itrSchema.virtual('taxLiability').get(function() {
  return Math.max(0, this.taxCalculation.totalTax - this.taxesPaid.total);
});

// Virtual for effective tax rate
itrSchema.virtual('effectiveTaxRate').get(function() {
  return this.income.total > 0 ? (this.taxCalculation.totalTax / this.income.total) * 100 : 0;
});

module.exports = mongoose.model('ITR', itrSchema);
