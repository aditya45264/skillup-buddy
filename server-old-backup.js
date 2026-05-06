
// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto'); // ⚠️ ADD THIS LINE
require("dotenv").config();

const Subscription = require("./models/Subscription");
const CourseNote = require("./models/CourseNote");

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret';

// ⚠️ ADD THIS CRITICAL SECTION:
const DEMO_MODE = !process.env.RAZORPAY_KEY_ID || 
                  process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id' ||
                  process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id_here';

console.log(`💳 Payment Mode: ${DEMO_MODE ? '🧪 DEMO (No Razorpay needed)' : '✅ LIVE (Razorpay active)'}`);
const app = express();



// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB Connection
// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB Atlas Connection Error:", err.message);
    console.error("💡 Check your connection string and network access settings");
    process.exit(1);
  });

// Import Models
const User = require("./models/User");
const Course = require("./models/Course");
const Review = require("./models/Review");


// ==================== MIDDLEWARE ====================

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register New User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !email || !password) {
      return res.status(400).json({ 
        message: "Please provide all required fields" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: "Email already registered" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      passwordHash,
      profilePhoto: ""
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        profilePhoto: newUser.profilePhoto,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Server error during registration" 
    });
  }
});

// Firebase Authentication Route
app.post("/api/auth/firebase-login", async (req, res) => {
  try {
    const { email, displayName, photoURL, provider } = req.body;
    
    console.log('🔥 Firebase login:', { email, provider });
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // User exists - update last login
      user.lastLogin = new Date();
      if (photoURL && !user.profilePhoto) {
        user.profilePhoto = photoURL;
      }
      await user.save();
      
      console.log('✅ Existing user logged in:', user.email);
    } else {
      // Create new user
      const nameParts = (displayName || email).split(' ');
      const firstName = nameParts[0] || email.split('@')[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      user = new User({
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        profilePhoto: photoURL || '',
        oauth: {
          provider: provider || 'google',
          providerId: email
        }
      });
      
      await user.save();
      console.log('✅ New user created:', user.email);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    res.json({
      message: "Login successful",
      token,
      user: user.toSafeObject()
    });
    
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Please provide email and password" 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during login" 
    });
  }
});

// Get Current User
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ 
      message: "Server error fetching user data" 
    });
  }
});

// ==================== PROFILE ROUTES ====================
// ==================== ENHANCED PROFILE UPDATE ====================
app.put("/api/profile/update", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, location, bio, profilePhoto } = req.body;

    // Validate profile photo size
    if (profilePhoto && profilePhoto.startsWith('data:image')) {
      const base64Length = profilePhoto.length - 'data:image/png;base64,'.length;
      const sizeInBytes = (base64Length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 5) {
        return res.status(400).json({ message: "Profile photo must be less than 5MB" });
      }
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email.toLowerCase();
    }
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

// ==================== ENHANCED QUIZ RESULTS ====================
app.post("/api/user/quiz-results", authenticateToken, async (req, res) => {
  try {
    const { answers, completedAt, duration, summary } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: "Invalid quiz answers format" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.quizResults = {
      answers: answers || {},
      completedAt: completedAt || new Date(),
      duration: duration || 0,
      summary: summary || {}
    };

    if (summary) {
      if (summary.skillLevel) {
        user.skillLevel = summary.skillLevel.toLowerCase();
      }
      if (summary.interests && Array.isArray(summary.interests)) {
        user.interests = summary.interests;
      }
    }

    user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;
    user.lastQuizDate = new Date();

    await user.save();

    console.log(`✅ Quiz results saved for user ${user.email}`);

    res.json({
      message: "Quiz results saved successfully",
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error("Save quiz results error:", error);
    res.status(500).json({ message: "Server error saving quiz results" });
  }
});

// ==================== ENHANCED COMPLETE DATA ====================
app.get("/api/user/complete-data", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cleanBookmarks = (user.bookmarkedCourses || []).map(id => String(id));

    res.json({
      user: user.toSafeObject(),
      quizResults: user.quizResults,
      bookmarkedCourses: cleanBookmarks,
      stats: {
        coursesExplored: user.coursesExplored || 0,
        quizzesCompleted: user.quizzesCompleted || 0,
        learningHours: user.learningHours || 0,
        savedCourses: cleanBookmarks.length
      }
    });

  } catch (error) {
    console.error("Get complete data error:", error);
    res.status(500).json({ message: "Server error fetching user data" });
  }
});

// ==================== ENHANCED BOOKMARK MANAGEMENT ====================
app.post("/api/user/bookmarks", authenticateToken, async (req, res) => {
  try {
    const { courseId, action } = req.body;
    
    console.log('📚 Bookmark request:', { courseId, action, userId: req.user.userId });
    
    if (!courseId || !action) {
      return res.status(400).json({ message: "courseId and action are required" });
    }

    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'add' or 'remove'" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courseIdStr = String(courseId);

    if (!user.bookmarkedCourses) {
      user.bookmarkedCourses = [];
    }

    user.bookmarkedCourses = user.bookmarkedCourses.map(id => String(id));

    if (action === "add") {
      if (!user.bookmarkedCourses.includes(courseIdStr)) {
        user.bookmarkedCourses.push(courseIdStr);
        console.log('✅ Added bookmark:', courseIdStr);
      }
    } else {
      user.bookmarkedCourses = user.bookmarkedCourses.filter(id => id !== courseIdStr);
      console.log('✅ Removed bookmark:', courseIdStr);
    }

    await user.save();

    res.json({
      message: "Bookmarks updated successfully",
      bookmarkedCourses: user.bookmarkedCourses,
      totalBookmarks: user.bookmarkedCourses.length
    });

  } catch (error) {
    console.error('❌ Error updating bookmarks:', error);
    res.status(500).json({ message: "Server error updating bookmarks" });
  }
});


// ==================== ENHANCED BOOKMARK SYNC ====================
app.put("/api/user/bookmarks/sync", authenticateToken, async (req, res) => {
  try {
    const { bookmarkedCourses } = req.body;

    if (!Array.isArray(bookmarkedCourses)) {
      return res.status(400).json({ message: "bookmarkedCourses must be an array" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cleanBookmarks = bookmarkedCourses
      .map(id => String(id))
      .filter(id => id && id !== 'undefined' && id !== 'null');

    user.bookmarkedCourses = cleanBookmarks;
    await user.save();

    console.log(`✅ Synced ${cleanBookmarks.length} bookmarks for user ${user.email}`);

    res.json({
      message: "Bookmarks synced successfully",
      bookmarkedCourses: user.bookmarkedCourses.map(id => String(id))
    });

  } catch (error) {
    console.error("Sync bookmarks error:", error);
    res.status(500).json({ message: "Server error syncing bookmarks" });
  }
});



// Update Learning Stats
app.put("/api/user/stats", authenticateToken, async (req, res) => {
  try {
    const { coursesExplored, learningHours } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (coursesExplored !== undefined) user.coursesExplored = coursesExplored;
    if (learningHours !== undefined) user.learningHours = learningHours;

    await user.save();

    res.json({
      message: "Stats updated successfully",
      stats: {
        coursesExplored: user.coursesExplored,
        learningHours: user.learningHours
      }
    });

  } catch (error) {
    console.error("Update stats error:", error);
    res.status(500).json({ message: "Server error updating stats" });
  }
});

// Change Password
app.put("/api/profile/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Please provide current and new password" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: "New password must be at least 8 characters" 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ 
      message: "Password changed successfully" 
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ 
      message: "Server error changing password" 
    });
  }
});

// ==================== COURSE ROUTES ====================

// Get All Courses (with filters)
app.get("/api/courses", async (req, res) => {
  try {
    const { type, topic, difficulty, search, limit = 50 } = req.query;

    let filter = {};
    
    if (type) filter.type = type;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const courses = await Course.find(filter)
      .limit(parseInt(limit))
      .sort({ rating: -1, createdAt: -1 });

    res.json({
      count: courses.length,
      courses
    });

  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ 
      message: "Server error fetching courses" 
    });
  }
});

// Get Course by ID
app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        message: "Course not found" 
      });
    }

    res.json(course);

  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ 
      message: "Server error fetching course" 
    });
  }
});

// Create Course (Admin/Testing only)
app.post("/api/courses", authenticateToken, async (req, res) => {
  try {
    const courseData = req.body;
    
    const newCourse = new Course(courseData);
    await newCourse.save();

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse
    });

  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ 
      message: "Server error creating course" 
    });
  }
});

// ==================== REVIEW ROUTES ====================

// Get All Approved Reviews (Public)
app.get("/api/reviews", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const reviews = await Review.find({ 
      isApproved: true, 
      isVisible: true 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ 
      message: "Server error fetching reviews" 
    });
  }
});

// ==================== ENHANCED REVIEW CREATION ====================
app.post("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    if (!rating || !title || !comment) {
      return res.status(400).json({ message: "Please provide rating, title, and comment" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (title.length < 10) {
      return res.status(400).json({ message: "Review title must be at least 10 characters" });
    }

    if (comment.length < 20) {
      return res.status(400).json({ message: "Review comment must be at least 20 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingReview = await Review.findOne({ userId: user._id });
    if (existingReview) {
      return res.status(400).json({ 
        message: "You have already submitted a review. You can edit your existing review." 
      });
    }

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const initials = (firstName.charAt(0) + 
      (lastName ? lastName.charAt(0) : firstName.charAt(1) || '')).toUpperCase();

    const newReview = new Review({
      userId: user._id,
      userName: `${firstName} ${lastName}`.trim() || user.email,
      userInitials: initials || 'SB',
      userPhoto: user.profilePhoto || "",
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim()
    });

    await newReview.save();

    res.status(201).json({
      message: "Review submitted successfully",
      review: newReview
    });

  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Server error creating review" });
  }
});

// Get User's Own Review (Authenticated)
app.get("/api/reviews/mine", authenticateToken, async (req, res) => {
  try {
    const review = await Review.findOne({ 
      userId: req.user.userId 
    });

    if (!review) {
      return res.status(404).json({ 
        message: "No review found" 
      });
    }

    res.json(review);

  } catch (error) {
    console.error("Get user review error:", error);
    res.status(500).json({ 
      message: "Server error fetching review" 
    });
  }
});

// Update User's Own Review (Authenticated)
app.put("/api/reviews/mine", authenticateToken, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    // Validation
    if (!rating || !title || !comment) {
      return res.status(400).json({ 
        message: "Please provide rating, title, and comment" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    const review = await Review.findOne({ 
      userId: req.user.userId 
    });

    if (!review) {
      return res.status(404).json({ 
        message: "Review not found" 
      });
    }

    // Update review
    review.rating = parseInt(rating);
    review.title = title.trim();
    review.comment = comment.trim();

    await review.save();

    res.json({
      message: "Review updated successfully",
      review
    });

  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ 
      message: "Server error updating review" 
    });
  }
});

// Delete User's Own Review (Authenticated)
app.delete("/api/reviews/mine", authenticateToken, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ 
      userId: req.user.userId 
    });

    if (!review) {
      return res.status(404).json({ 
        message: "Review not found" 
      });
    }

    res.json({ 
      message: "Review deleted successfully" 
    });

  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ 
      message: "Server error deleting review" 
    });
  }
});

// ==================== PAYMENT ROUTES ====================

// Create Order
app.post("/api/subscription/create-order", authenticateToken, async (req, res) => {
  try {
    console.log('📥 Create order request received');
    const { plan, amount } = req.body;

    if (plan !== 'pro' || amount !== 199) {
      return res.status(400).json({ message: "Invalid plan or amount" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isPro()) {
      return res.status(400).json({ message: "Already Pro subscriber" });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const subscription = new Subscription({
      userId: user._id,
      plan: 'pro',
      status: 'pending',
      amount: 199,
      currency: 'INR',
      razorpayOrderId: orderId
    });

    await subscription.save();

    console.log('✅ Order created:', orderId);

    res.json({
      orderId: orderId,
      amount: 199.00,
      currency: "INR",
      razorpayKeyId: DEMO_MODE ? 'DEMO_KEY_12345' : RAZORPAY_KEY_ID,
      demoMode: DEMO_MODE,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || ""
      }
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Verify Payment
app.post("/api/subscription/verify-payment", authenticateToken, async (req, res) => {
  try {
    console.log('📥 Verify payment request received');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, demoMode } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ message: "Missing order ID" });
    }

    const subscription = await Subscription.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Demo mode - skip signature verification
    if (DEMO_MODE || demoMode) {
      console.log('🧪 DEMO MODE: Skipping signature verification');
    } else {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    // Update subscription
    subscription.status = 'active';
    subscription.razorpayPaymentId = razorpay_payment_id || `demo_pay_${Date.now()}`;
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subscription.save();

    // Update user
    const user = await User.findById(subscription.userId);
    user.subscription = {
      plan: 'pro',
      status: 'active',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      razorpaySubscriptionId: subscription._id
    };
    await user.save();

    console.log(`✅ Pro activated: ${user.email}`);

    res.json({
      message: "Payment verified",
      demoMode: DEMO_MODE || demoMode,
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ message: error.message });
  }
});

console.log('💳 Payment routes initialized');


// Check Subscription Status
app.get("/api/subscription/status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPro = user.isPro();

    res.json({
      plan: user.subscription.plan,
      status: user.subscription.status,
      isPro: isPro,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      features: {
        courseNotes: isPro,
        pdfDownload: isPro,
        unlimitedBookmarks: isPro,
        prioritySupport: isPro
      }
    });

  } catch (error) {
    console.error("Subscription status error:", error);
    res.status(500).json({ message: "Server error fetching subscription" });
  }
});

// Cancel Subscription
app.post("/api/subscription/cancel", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isPro()) {
      return res.status(400).json({ message: "No active subscription to cancel" });
    }

    // Find active subscription
    const subscription = await Subscription.findById(
      user.subscription.razorpaySubscriptionId
    );

    if (subscription) {
      subscription.status = 'cancelled';
      await subscription.save();
    }

    user.subscription.status = 'cancelled';
    await user.save();

    res.json({
      message: "Subscription cancelled successfully. You can continue using Pro features until the end of your billing period.",
      endDate: user.subscription.endDate
    });

  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: "Server error cancelling subscription" });
  }
});

// Get User's Subscription History
app.get("/api/subscription/history", authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      count: subscriptions.length,
      subscriptions: subscriptions
    });

  } catch (error) {
    console.error("Subscription history error:", error);
    res.status(500).json({ message: "Server error fetching history" });
  }
});

console.log('💳 Razorpay payment routes initialized');


// ADD THESE ROUTES TO server.js - COURSE NOTES FEATURE (PRO ONLY)



// ==================== DEMO MODE PAYMENT SYSTEM ====================

// This endpoint allows instant Pro activation for testing - REMOVE IN PRODUCTION
app.post("/api/subscription/demo-activate", authenticateToken, async (req, res) => {
  try {
    // Only allow in demo mode
    if (!DEMO_MODE) {
      return res.status(403).json({ 
        message: "Demo activation only available in demo mode" 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create subscription
    const subscription = new Subscription({
      userId: user._id,
      plan: 'pro',
      status: 'active',
      amount: 199,
      currency: 'INR',
      razorpayOrderId: `demo_${Date.now()}`,
      razorpayPaymentId: `demo_pay_${Date.now()}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await subscription.save();

    // Update user
    user.subscription = {
      plan: 'pro',
      status: 'active',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      razorpaySubscriptionId: subscription._id
    };

    await user.save();

    console.log(`🧪 DEMO: Instant Pro activation for ${user.email}`);

    res.json({
      message: "Demo Pro subscription activated! (30 days)",
      user: user.toSafeObject(),
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    });

  } catch (error) {
    console.error("Demo activate error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

console.log('💳 Payment routes initialized with demo mode support');



// Middleware to check Pro subscription
const requireProSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isPro()) {
      return res.status(403).json({ 
        message: "This feature is only available for Pro subscribers",
        upgradeRequired: true,
        plan: "pro"
      });
    }

    req.user.isPro = true;
    next();
  } catch (error) {
    console.error("Pro check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== COURSE NOTES ROUTES (PRO FEATURE) ====================

// Get Notes for a Course (Pro only)
app.get("/api/courses/:courseId/notes", authenticateToken, requireProSubscription, async (req, res) => {
  try {
    const { courseId } = req.params;

    let courseNote = await CourseNote.findOne({ 
      courseId: courseId,
      isPublished: true 
    });

    if (!courseNote) {
      // Create default notes if not exists
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      courseNote = new CourseNote({
        courseId: courseId,
        courseName: course.title,
        content: {
          introduction: `Welcome to ${course.title}! This course will help you master ${course.topic}.`,
          keyTopics: [
            {
              title: "Getting Started",
              description: "Introduction to the fundamentals and basic concepts"
            },
            {
              title: "Core Concepts",
              description: "Deep dive into essential topics and techniques"
            },
            {
              title: "Practical Application",
              description: "Hands-on projects and real-world examples"
            }
          ],
          learningObjectives: [
            "Understand the fundamental concepts",
            "Apply knowledge to practical scenarios",
            "Build real-world projects",
            "Master best practices"
          ],
          prerequisites: [
            "Basic computer skills",
            "Internet connection",
            "Enthusiasm to learn"
          ],
          summary: `This comprehensive course covers everything you need to know about ${course.topic}. Perfect for ${course.difficulty} level learners.`,
          resources: [
            {
              title: "Official Documentation",
              url: "#",
              type: "documentation"
            },
            {
              title: "Community Forum",
              url: "#",
              type: "forum"
            }
          ],
          tips: [
            "Take notes while watching the course",
            "Practice regularly for better retention",
            "Join the community for support",
            "Build projects to apply your learning"
          ]
        }
      });

      await courseNote.save();
    }

    // Increment view count
    await courseNote.incrementViews();

    res.json({
      courseNote: courseNote,
      message: "Course notes retrieved successfully"
    });

  } catch (error) {
    console.error("Get course notes error:", error);
    res.status(500).json({ message: "Server error fetching notes" });
  }
});

// Generate PDF for Course Notes (Pro only)
app.post("/api/courses/:courseId/notes/pdf", authenticateToken, requireProSubscription, async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseNote = await CourseNote.findOne({ 
      courseId: courseId,
      isPublished: true 
    });

    if (!courseNote) {
      return res.status(404).json({ message: "Course notes not found" });
    }

    // Increment download count
    await courseNote.incrementDownloads();

    // In a real application, you would generate an actual PDF here
    // For now, we'll return the data that can be used to generate PDF on frontend
    
    const pdfData = {
      courseId: courseNote.courseId,
      courseName: courseNote.courseName,
      content: courseNote.content,
      generatedAt: new Date(),
      downloadCount: courseNote.downloadCount
    };

    res.json({
      message: "PDF data ready for download",
      pdfData: pdfData,
      // In production, this would be a real PDF URL
      downloadUrl: `/api/courses/${courseId}/notes/download`
    });

  } catch (error) {
    console.error("Generate PDF error:", error);
    res.status(500).json({ message: "Server error generating PDF" });
  }
});

// Get All Available Course Notes (for Pro users)
app.get("/api/course-notes", authenticateToken, requireProSubscription, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const notes = await CourseNote.find({ isPublished: true })
      .limit(parseInt(limit))
      .sort({ viewCount: -1, createdAt: -1 });

    res.json({
      count: notes.length,
      notes: notes
    });

  } catch (error) {
    console.error("Get all notes error:", error);
    res.status(500).json({ message: "Server error fetching notes" });
  }
});

// Check if User has Access to Pro Features
app.get("/api/pro-features/check", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPro = user.isPro();

    res.json({
      isPro: isPro,
      plan: user.subscription.plan,
      status: user.subscription.status,
      features: {
        courseNotes: isPro,
        pdfDownload: isPro,
        unlimitedBookmarks: isPro,
        prioritySupport: isPro,
        noAds: isPro
      },
      subscription: user.subscription
    });

  } catch (error) {
    console.error("Pro features check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

console.log('📝 Course Notes Pro features initialized');




// ==================== HEALTH CHECK ====================

app.get("/", (req, res) => {
  res.json({ 
    message: "SkillUp Buddy API is running",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found" 
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    message: "Internal server error" 
  });
});

// ADD THESE ROUTES TO server.js (after existing routes)

// ==================== RAZORPAY PAYMENT INTEGRATION ====================
/*
const crypto = require('crypto');

// Razorpay Configuration (Add to .env file)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret';

// Import Subscription model
const Subscription = require("./models/Subscription");

// Create Razorpay Order
app.post("/api/subscription/create-order", authenticateToken, async (req, res) => {
  try {
    const { plan, amount } = req.body;

    // Validate plan
    if (plan !== 'pro') {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    // Validate amount (₹499 for Pro)
    if (amount !== 499) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has active subscription
    if (user.isPro()) {
      return res.status(400).json({ 
        message: "You already have an active Pro subscription" 
      });
    }

    // Create Razorpay order ID (in production, use actual Razorpay SDK)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create subscription record
    const subscription = new Subscription({
      userId: user._id,
      plan: 'pro',
      status: 'pending',
      amount: amount,
      currency: 'INR',
      razorpayOrderId: orderId
    });

    await subscription.save();

    res.json({
      orderId: orderId,
      amount: amount * 100, // Amount in paise
      currency: "INR",
      razorpayKeyId: RAZORPAY_KEY_ID,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || ""
      }
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error creating order" });
  }
});

// Verify Razorpay Payment
app.post("/api/subscription/verify-payment", authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    // For demo purposes, we'll accept any signature
    // In production, uncomment this verification:
    /*
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }
    ***

    // Find subscription
    const subscription = await Subscription.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Update subscription
    subscription.status = 'active';
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    subscription.paymentHistory.push({
      date: new Date(),
      amount: subscription.amount,
      paymentId: razorpay_payment_id,
      status: 'success'
    });

    await subscription.save();

    // Update user
    const user = await User.findById(subscription.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subscription = {
      plan: 'pro',
      status: 'active',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      razorpaySubscriptionId: subscription._id
    };

    await user.save();

    console.log(`✅ Pro subscription activated for user: ${user.email}`);

    res.json({
      message: "Payment verified successfully",
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Server error verifying payment" });
  }
});
*/

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
});