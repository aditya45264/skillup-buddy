// models/Course.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // free YouTube or paid platform
    type: { type: String, enum: ["free", "paid"], default: "free" },

    title: { type: String, required: true },
    provider: { type: String, required: true },     // e.g. "Udemy", "freeCodeCamp"
    platform: { type: String, default: "" },        // Udemy / Coursera / etc (for paid)

    thumbnail: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    duration: { type: String, default: "" },        // "12 hours"

    description: { type: String, default: "" },
    topic: { type: String, default: "" },           // "programming","design","business","marketing","data-mining"
    difficulty: { type: String, default: "" },      // "beginner","intermediate","advanced"

    url: { type: String, required: true },          // YouTube / platform link
    videoId: { type: String, default: "" },         // YouTube video ID (for free videos)

    students: { type: Number, default: 0 },

    // price in **Indian rupees**. 0 = free
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
