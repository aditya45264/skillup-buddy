// models/Subscription.js
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free"
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending"],
      default: "pending"
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    // Razorpay details
    razorpayOrderId: {
      type: String,
      default: ""
    },
    razorpayPaymentId: {
      type: String,
      default: ""
    },
    razorpaySignature: {
      type: String,
      default: ""
    },
    // Subscription period
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: false
    },
    // Payment history
    paymentHistory: [{
      date: { type: Date, default: Date.now },
      amount: Number,
      paymentId: String,
      status: String
    }]
  },
  { timestamps: true }
);

// Index for faster queries
subscriptionSchema.index({ userId: 1, status: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Method to check if subscription has expired
subscriptionSchema.methods.hasExpired = function() {
  return this.endDate < new Date();
};

module.exports = mongoose.model("Subscription", subscriptionSchema);