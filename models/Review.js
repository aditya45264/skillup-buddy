// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userInitials: {
      type: String,
      required: true
    },
    userPhoto: {
      type: String,
      default: ""
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    isApproved: {
      type: Boolean,
      default: true // Auto-approve for now, can add moderation later
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
reviewSchema.index({ isApproved: 1, isVisible: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);