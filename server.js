// server.js - Complete SkillUp Buddy Backend with Pro Features
const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins (LAN, localhost, any IP)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// MODELS
// ============================================================================
const User = require("./models/User");
const Course = require("./models/Course");
const CourseNote = require("./models/CourseNote");
const Subscription = require("./models/Subscription");
const Review = require("./models/Review");

// ============================================================================
// MONGODB CONNECTION
// ============================================================================
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ============================================================================
// PRO SUBSCRIPTION MIDDLEWARE
// ============================================================================
const proMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const isPro = req.user.isPro();
    
    if (!isPro) {
      return res.status(403).json({ 
        message: "This is a Pro feature. Upgrade to access it.",
        upgradeRequired: true,
        currentPlan: req.user.subscription?.plan || 'free'
      });
    }

    next();
  } catch (error) {
    console.error("Pro middleware error:", error);
    res.status(500).json({ message: "Error checking subscription status" });
  }
};

// ============================================================================
// AUTH ROUTES
// ============================================================================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      passwordHash,
      firstName,
      lastName,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date()
      }
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Login successful",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ============================================================================
// GET CURRENT USER - /api/auth/me
// (Called by user_profile_management.html)
// ============================================================================
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// ============================================================================
// FIREBASE LOGIN (Stub - in case frontend calls it)
// ============================================================================
app.post("/api/auth/firebase-login", async (req, res) => {
  try {
    const { email, firebaseToken, firstName, lastName, profilePhoto } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user from Firebase data
      const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      user = new User({
        email,
        passwordHash,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        profilePhoto: profilePhoto || '',
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date()
        },
        oauth: {
          provider: 'firebase',
          providerId: firebaseToken || ''
        }
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Firebase login successful",
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Firebase login error:", error);
    res.status(500).json({ message: "Firebase login failed" });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

// Get complete user data (with quiz results & bookmarks)
app.get("/api/user/complete-data", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: user.toSafeObject(),
      quizResults: user.quizResults,
      bookmarkedCourses: user.bookmarkedCourses || [],
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Update user profile - /api/user/profile
// (Original route - kept for compatibility)
app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      "firstName", "lastName", "phone", "location", "bio", "profilePhoto",
    ];

    const user = await User.findById(req.user._id);
    
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ============================================================================
// UPDATE PROFILE - /api/profile/update
// (Called by user_profile_management.html)
// ============================================================================
app.put("/api/profile/update", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      "firstName", "lastName", "phone", "location", "bio", "profilePhoto",
      "notifications", "privacy", "skillLevel", "interests",
      "learningFormats", "timeAvailability"
    ];

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Also handle POST for profile update (some frontends use POST)
app.post("/api/profile/update", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      "firstName", "lastName", "phone", "location", "bio", "profilePhoto",
      "notifications", "privacy", "skillLevel", "interests",
      "learningFormats", "timeAvailability"
    ];

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ============================================================================
// CHANGE PASSWORD - /api/profile/change-password
// (Called by user_profile_management.html — supports both PUT and POST)
// ============================================================================
app.put("/api/profile/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

app.post("/api/profile/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// Save quiz results
app.post("/api/user/quiz-results", authMiddleware, async (req, res) => {
  try {
    const quizData = req.body;
    const user = await User.findById(req.user._id);

    user.quizResults = {
      answers: quizData.answers,
      completedAt: new Date(quizData.completedAt),
      duration: quizData.duration,
      summary: quizData.summary,
    };

    user.lastQuizDate = new Date();
    user.quizzesCompleted += 1;

    await user.save();

    res.json({
      message: "Quiz results saved successfully",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Quiz save error:", error);
    res.status(500).json({ message: "Failed to save quiz results" });
  }
});

// Update user stats
app.put("/api/user/stats", authMiddleware, async (req, res) => {
  try {
    const { coursesExplored, learningHours, streakDays } = req.body;
    const user = await User.findById(req.user._id);

    if (coursesExplored !== undefined) user.coursesExplored = coursesExplored;
    if (learningHours !== undefined) user.learningHours = learningHours;
    if (streakDays !== undefined) user.streakDays = streakDays;

    await user.save();

    res.json({
      success: true,
      message: "Stats updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Stats update error:", error);
    res.status(500).json({ message: "Failed to update stats" });
  }
});

// Bookmark management
app.post("/api/user/bookmarks", authMiddleware, async (req, res) => {
  try {
    const { courseId, action } = req.body;
    const user = await User.findById(req.user._id);

    if (action === "add") {
      user.addBookmark(courseId);
    } else if (action === "remove") {
      user.removeBookmark(courseId);
    }

    await user.save();

    res.json({
      message: `Bookmark ${action === "add" ? "added" : "removed"} successfully`,
      bookmarkedCourses: user.bookmarkedCourses,
    });
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ message: "Failed to update bookmark" });
  }
});

// Sync bookmarks (bulk update)
app.put("/api/user/bookmarks/sync", authMiddleware, async (req, res) => {
  try {
    const { bookmarkedCourses } = req.body;
    const user = await User.findById(req.user._id);

    if (Array.isArray(bookmarkedCourses)) {
      user.bookmarkedCourses = bookmarkedCourses.map(id => String(id)).filter(id => id && id !== 'undefined');
      await user.save();
    }

    res.json({
      success: true,
      message: "Bookmarks synced successfully",
      bookmarkedCourses: user.bookmarkedCourses
    });
  } catch (error) {
    console.error("Bookmark sync error:", error);
    res.status(500).json({ message: "Failed to sync bookmarks" });
  }
});

// ============================================================================
// COURSE ROUTES
// ============================================================================

// Get all courses
app.get("/api/courses", async (req, res) => {
  try {
    const { type, topic, difficulty, limit } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    let coursesQuery = Course.find(query).sort({ rating: -1 });
    
    if (limit) {
      coursesQuery = coursesQuery.limit(parseInt(limit));
    }

    const courses = await coursesQuery;

    res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Get single course
app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

// ============================================================================
// PRO FEATURES - COURSE NOTES ROUTES
// ============================================================================

// Check Pro status
app.get("/api/pro-features/check", authMiddleware, async (req, res) => {
  try {
    const isPro = req.user.isPro();
    
    res.json({
      isPro,
      subscription: {
        plan: req.user.subscription?.plan || 'free',
        status: req.user.subscription?.status || 'active',
        endDate: req.user.subscription?.endDate || null
      }
    });
  } catch (error) {
    console.error("Error checking Pro status:", error);
    res.status(500).json({ message: "Failed to check Pro status" });
  }
});

// Get course notes (Pro feature)
app.get("/api/courses/:courseId/notes", authMiddleware, proMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log(`📝 Fetching notes for course: ${courseId}`);

    let courseNote = await CourseNote.findOne({ 
      courseId: courseId,
      isPublished: true 
    });

    if (!courseNote) {
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const newNote = new CourseNote({
        courseId: course._id.toString(),
        courseName: course.title,
        content: {
          introduction: `Welcome to ${course.title}! This course will help you learn ${course.topic}.`,
          keyTopics: [
            { title: 'Introduction', description: 'Get started with the basics' },
            { title: 'Core Concepts', description: 'Learn the fundamental concepts' },
            { title: 'Practical Application', description: "Apply what you've learned" }
          ],
          learningObjectives: [
            'Understand the fundamental concepts',
            'Apply knowledge to real-world scenarios',
            'Build practical projects'
          ],
          prerequisites: [
            'Basic computer skills',
            'Willingness to learn'
          ],
          summary: `This ${course.difficulty || 'comprehensive'} course covers everything you need to know about ${course.topic}.`,
          resources: [
            { title: 'Course Link', url: course.url, type: 'video' }
          ],
          tips: [
            'Practice regularly',
            'Take notes during the course',
            'Build projects to reinforce learning'
          ]
        },
        isPublished: true
      });

      await newNote.save();
      await newNote.incrementViews();

      return res.json({ success: true, courseNote: newNote });
    }

    await courseNote.incrementViews();

    res.json({ success: true, courseNote });

  } catch (error) {
    console.error("Error fetching course notes:", error);
    res.status(500).json({ 
      message: "Failed to fetch course notes",
      error: error.message 
    });
  }
});

// Generate and download course PDF (Pro feature)
app.post("/api/courses/:courseId/notes/pdf", authMiddleware, proMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log(`📄 Generating PDF for course: ${courseId}`);

    let courseNote = await CourseNote.findOne({ 
      courseId: courseId,
      isPublished: true 
    });

    if (!courseNote) {
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      courseNote = new CourseNote({
        courseId: course._id.toString(),
        courseName: course.title,
        content: {
          introduction: `Welcome to ${course.title}!`,
          keyTopics: [],
          learningObjectives: [],
          prerequisites: [],
          summary: `${course.title} - ${course.topic}`,
          resources: [],
          tips: []
        },
        isPublished: true
      });

      await courseNote.save();
    }

    await courseNote.incrementDownloads();

    const pdfData = {
      courseName: courseNote.courseName,
      courseId: courseNote.courseId,
      content: courseNote.content,
      generatedAt: new Date().toISOString(),
      userEmail: req.user.email
    };

    res.json({
      success: true,
      message: "PDF data generated successfully",
      pdfData
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ 
      message: "Failed to generate PDF",
      error: error.message 
    });
  }
});

// ============================================================================
// SUBSCRIPTION ROUTES
// ============================================================================

// Create Pro subscription order
app.post("/api/subscription/create-order", authMiddleware, async (req, res) => {
  try {
    const { plan, amount } = req.body;
    
    console.log(`📝 Creating order for: ${req.user.email}`);
    console.log(`💰 Plan: ${plan}, Amount: ₹${amount}`);

    if (amount !== 199) {
      console.warn(`⚠️ Unexpected amount: ${amount}, expected 199`);
    }

    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan: plan,
        email: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`
      }
    };

    const order = await razorpayInstance.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      demoMode: false,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error("❌ Razorpay order error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create order",
      error: error.message 
    });
  }
});

// ============================================================================
// VERIFY PAYMENT & ACTIVATE PRO
// Handles BOTH real Razorpay payments AND demo mode payments
// ============================================================================
app.post("/api/subscription/verify", authMiddleware, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      demoMode
    } = req.body;

    console.log('🔍 Verifying payment...');
    console.log('📦 Order ID:', razorpay_order_id);
    console.log('💳 Payment ID:', razorpay_payment_id);
    console.log('🧪 Demo Mode:', demoMode);

    // ==================== DEMO MODE ====================
    if (demoMode === true || razorpay_payment_id?.startsWith('demo_pay_')) {
      console.log('🧪 Processing demo payment...');

      const user = await User.findById(req.user._id);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      user.subscription = {
        plan: 'pro',
        status: 'active',
        startDate,
        endDate,
        razorpaySubscriptionId: razorpay_order_id || `demo_order_${Date.now()}`
      };

      await user.save();

      // Save demo subscription record
      const subscription = new Subscription({
        userId: user._id,
        plan: 'pro',
        status: 'active',
        amount: 199,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id || `demo_order_${Date.now()}`,
        razorpayPaymentId: razorpay_payment_id || `demo_pay_${Date.now()}`,
        razorpaySignature: 'demo_signature',
        startDate,
        endDate,
        autoRenew: false,
        paymentHistory: [{
          date: new Date(),
          amount: 199,
          paymentId: razorpay_payment_id || 'demo',
          status: 'demo_success'
        }]
      });

      await subscription.save();

      console.log(`✅ Demo Pro activated for: ${user.email}`);

      return res.json({
        success: true,
        message: "🎉 Demo Pro subscription activated!",
        subscription: {
          plan: 'pro',
          status: 'active',
          startDate,
          endDate,
          amount: 199,
          currency: 'INR'
        },
        user: user.toSafeObject()
      });
    }

    // ==================== REAL RAZORPAY PAYMENT ====================
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('❌ Invalid signature!');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    console.log('✅ Signature verified!');

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    console.log('💰 Payment status:', payment.status);
    console.log('💵 Amount paid:', payment.amount / 100, 'INR');

    if (payment.status !== 'captured') {
      console.error('❌ Payment not captured:', payment.status);
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const user = await User.findById(req.user._id);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    user.subscription = {
      plan: 'pro',
      status: 'active',
      startDate,
      endDate,
      razorpaySubscriptionId: razorpay_order_id
    };

    await user.save();

    console.log(`✅ Pro activated for: ${user.email}`);

    const subscription = new Subscription({
      userId: user._id,
      plan: 'pro',
      status: 'active',
      amount: payment.amount / 100,
      currency: payment.currency,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      startDate,
      endDate,
      autoRenew: false,
      paymentHistory: [{
        date: new Date(),
        amount: payment.amount / 100,
        paymentId: razorpay_payment_id,
        status: 'success'
      }]
    });

    await subscription.save();

    console.log('💾 Subscription saved to database');

    res.json({
      success: true,
      message: "🎉 Pro subscription activated!",
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate,
        endDate,
        amount: payment.amount / 100,
        currency: payment.currency
      },
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Payment verification failed",
      error: error.message 
    });
  }
});

// ============================================================================
// ALIAS: /api/subscription/verify-payment → same as /api/subscription/verify
// (In case any frontend file still uses the old URL)
// ============================================================================
app.post("/api/subscription/verify-payment", authMiddleware, async (req, res) => {
  // Forward to the same handler logic by reusing req/res
  req.url = '/api/subscription/verify';
  
  // Just duplicate the handler inline to keep it simple
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      demoMode
    } = req.body;

    if (demoMode === true || razorpay_payment_id?.startsWith('demo_pay_')) {
      const user = await User.findById(req.user._id);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      user.subscription = {
        plan: 'pro', status: 'active', startDate, endDate,
        razorpaySubscriptionId: razorpay_order_id || `demo_order_${Date.now()}`
      };
      await user.save();

      const subscription = new Subscription({
        userId: user._id, plan: 'pro', status: 'active', amount: 199,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id || `demo_order_${Date.now()}`,
        razorpayPaymentId: razorpay_payment_id || `demo_pay_${Date.now()}`,
        razorpaySignature: 'demo_signature', startDate, endDate, autoRenew: false,
        paymentHistory: [{ date: new Date(), amount: 199, paymentId: razorpay_payment_id || 'demo', status: 'demo_success' }]
      });
      await subscription.save();

      return res.json({
        success: true,
        message: "🎉 Demo Pro subscription activated!",
        subscription: { plan: 'pro', status: 'active', startDate, endDate, amount: 199, currency: 'INR' },
        user: user.toSafeObject()
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const user = await User.findById(req.user._id);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    user.subscription = { plan: 'pro', status: 'active', startDate, endDate, razorpaySubscriptionId: razorpay_order_id };
    await user.save();

    const subscription = new Subscription({
      userId: user._id, plan: 'pro', status: 'active', amount: payment.amount / 100,
      currency: payment.currency, razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature,
      startDate, endDate, autoRenew: false,
      paymentHistory: [{ date: new Date(), amount: payment.amount / 100, paymentId: razorpay_payment_id, status: 'success' }]
    });
    await subscription.save();

    res.json({
      success: true, message: "🎉 Pro subscription activated!",
      subscription: { plan: 'pro', status: 'active', startDate, endDate, amount: payment.amount / 100, currency: payment.currency },
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
});

// Get subscription status
app.get("/api/subscription/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      isPro: user.isPro(),
      subscription: user.subscription || { plan: 'free', status: 'inactive' }
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
});

console.log('✅ Razorpay integration loaded (₹199 pricing)');

// ============================================================================
// REVIEW ROUTES
// ============================================================================

// Get all reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const reviews = await Review.find({ 
      isApproved: true, 
      isVisible: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// Get my review
app.get("/api/reviews/mine", authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({ userId: req.user._id });
    res.json({
      success: true,
      review: review || null
    });
  } catch (error) {
    console.error("Error fetching my review:", error);
    res.status(500).json({ message: "Failed to fetch review" });
  }
});

// Create review
app.post("/api/reviews", authMiddleware, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    if (!rating || !title || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already has a review
    const existingReview = await Review.findOne({ userId: req.user._id });
    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review. Please edit your existing review." });
    }

    const review = new Review({
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
      userInitials: req.user.firstName.charAt(0) + (req.user.lastName ? req.user.lastName.charAt(0) : ''),
      userPhoto: req.user.profilePhoto || '',
      rating,
      title,
      comment
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

// Update my review
app.put("/api/reviews/mine", authMiddleware, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({ userId: req.user._id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    res.json({
      success: true,
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
});

// Delete my review
app.delete("/api/reviews/mine", authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ userId: req.user._id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================================
// 404 HANDLER — Must return JSON, never HTML
// (Prevents the "Unexpected token '<'" error on missing routes)
// ============================================================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// START SERVER — 0.0.0.0 allows connections from any PC on the network
// ============================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SkillUp Buddy Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  console.log(`🌐 Network:  http://0.0.0.0:${PORT}/api`);
  console.log(`\n✨ All Routes Loaded:`);
  console.log(`   🔐 Auth:          POST /api/auth/register`);
  console.log(`   🔐 Auth:          POST /api/auth/login`);
  console.log(`   🔐 Auth:          GET  /api/auth/me`);
  console.log(`   🔐 Auth:          POST /api/auth/firebase-login`);
  console.log(`   👤 Profile:       PUT  /api/user/profile`);
  console.log(`   👤 Profile:       PUT  /api/profile/update`);
  console.log(`   🔑 Password:      POST /api/profile/change-password`);
  console.log(`   📚 Courses:       GET  /api/courses`);
  console.log(`   📝 Notes (Pro):   GET  /api/courses/:id/notes`);
  console.log(`   📄 PDF (Pro):     POST /api/courses/:id/notes/pdf`);
  console.log(`   ✅ Pro Check:     GET  /api/pro-features/check`);
  console.log(`   💳 Payment:       POST /api/subscription/create-order`);
  console.log(`   💳 Verify:        POST /api/subscription/verify`);
  console.log(`   ⭐ Reviews:       GET  /api/reviews\n`);
});

module.exports = app;