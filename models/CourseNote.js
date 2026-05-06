// models/CourseNote.js - FIXED VERSION
const mongoose = require("mongoose");

const courseNoteSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      index: true
    },
    courseName: {
      type: String,
      required: true
    },
    
    // Note content - all fields are optional to prevent validation errors
    content: {
      introduction: {
        type: String,
        default: ""
      },
      keyTopics: {
        type: [{
          title: { type: String, default: "" },
          description: { type: String, default: "" }
        }],
        default: []
      },
      learningObjectives: {
        type: [String],
        default: []
      },
      prerequisites: {
        type: [String],
        default: []
      },
      summary: {
        type: String,
        default: ""
      },
      resources: {
        type: [{
          title: { type: String, default: "" },
          url: { type: String, default: "" },
          type: { type: String, default: "link" }
        }],
        default: []
      },
      tips: {
        type: [String],
        default: []
      }
    },
    
    // PDF metadata
    pdfGenerated: {
      type: Boolean,
      default: false
    },
    pdfUrl: {
      type: String,
      default: ""
    },
    
    // Statistics
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    
    // Status
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    // This prevents validation errors for missing fields
    strict: false
  }
);

// Index for faster queries
courseNoteSchema.index({ courseId: 1, isPublished: 1 });

// Method to increment view count
courseNoteSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment download count
courseNoteSchema.methods.incrementDownloads = function() {
  this.downloadCount += 1;
  return this.save();
};

module.exports = mongoose.model("CourseNote", courseNoteSchema);