// models/User.js - UPDATED VERSION WITH SUBSCRIPTION SUPPORT
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      default: "", 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    
    // Profile Information
    profilePhoto: { 
      type: String, 
      default: "" 
    },
    phone: { 
      type: String, 
      default: "" 
    },
    location: { 
      type: String, 
      default: "" 
    },
    bio: { 
      type: String, 
      default: "" 
    },
    
    // Subscription Information - NEW
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free"
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "expired"],
        default: "active"
      },
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      },
      razorpaySubscriptionId: {
        type: String,
        default: ""
      }
    },
    
    // Learning Preferences
    skillLevel: { 
      type: String, 
      enum: ["beginner", "some-basics", "intermediate", "advanced", "expert", ""],
      default: "" 
    },
    interests: {
      type: [String],
      default: []
    },
    learningFormats: {
      type: [String],
      default: []
    },
    timeAvailability: {
      type: String,
      default: ""
    },
    
    // Quiz Results Storage
    quizResults: {
      answers: { 
        type: Map, 
        of: mongoose.Schema.Types.Mixed, 
        default: {} 
      },
      completedAt: { 
        type: Date 
      },
      duration: { 
        type: Number 
      },
      summary: {
        skillLevel: { type: String, default: "" },
        interests: { type: [String], default: [] },
        interestCount: { type: Number, default: 0 },
        primaryGoal: { type: String, default: "" }
      }
    },
    
    // Bookmarked Courses
    bookmarkedCourses: {
      type: [String],
      default: []
    },
    
    // Learning Progress
    coursesExplored: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    learningHours: {
      type: Number,
      default: 0
    },
    
    // Activity Tracking
    lastQuizDate: {
      type: Date
    },
    streakDays: {
      type: Number,
      default: 0
    },
    
    // Notification Settings
    notifications: {
      courseRecommendations: { type: Boolean, default: true },
      learningReminders: { type: Boolean, default: true },
      progressReports: { type: Boolean, default: false },
      marketingComms: { type: Boolean, default: false }
    },
    
    // Privacy Settings
    privacy: {
      profileVisibility: { type: Boolean, default: false },
      dataAnalytics: { type: Boolean, default: true }
    },
    
    // Account Status
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastLogin: { 
      type: Date, 
      default: Date.now 
    },
    
    // OAuth
    oauth: {
      provider: { type: String, default: "" },
      providerId: { type: String, default: "" }
    }
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
userSchema.index({ email: 1 });

// Pre-save hook
userSchema.pre('save', function(next) {
  if (this.bookmarkedCourses && Array.isArray(this.bookmarkedCourses)) {
    this.bookmarkedCourses = this.bookmarkedCourses.map(id => String(id));
  }
  next();
});

// Method to safely return user data
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.passwordHash;
  
  if (user.bookmarkedCourses) {
    user.bookmarkedCourses = user.bookmarkedCourses.map(id => String(id));
  }
  
  return user;
};

// NEW: Check if user has Pro subscription
userSchema.methods.isPro = function() {
  if (this.subscription.plan === "pro" && 
      this.subscription.status === "active" && 
      this.subscription.endDate && 
      this.subscription.endDate > new Date()) {
    return true;
  }
  return false;
};

// Bookmark methods
userSchema.methods.addBookmark = function(courseId) {
  const idStr = String(courseId);
  if (!this.bookmarkedCourses.includes(idStr)) {
    this.bookmarkedCourses.push(idStr);
  }
  return this.bookmarkedCourses;
};

userSchema.methods.removeBookmark = function(courseId) {
  const idStr = String(courseId);
  this.bookmarkedCourses = this.bookmarkedCourses.filter(id => id !== idStr);
  return this.bookmarkedCourses;
};

userSchema.methods.hasBookmark = function(courseId) {
  const idStr = String(courseId);
  return this.bookmarkedCourses.includes(idStr);
};

module.exports = mongoose.model("User", userSchema);