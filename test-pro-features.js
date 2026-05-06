// test-pro-features.js
// Run this script to test Pro features without manual database updates

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const CourseNote = require('./models/CourseNote');
const Course = require('./models/Course');

async function grantProAccess(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email });
        
        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Grant Pro access for 30 days
        user.subscription = {
            plan: 'pro',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            razorpaySubscriptionId: 'test_subscription_' + Date.now()
        };

        await user.save();

        console.log('\n🎉 Pro access granted successfully!');
        console.log('📧 User:', user.email);
        console.log('📅 Subscription:');
        console.log('   - Plan:', user.subscription.plan);
        console.log('   - Status:', user.subscription.status);
        console.log('   - Expires:', user.subscription.endDate.toLocaleDateString());
        console.log('\n✨ User can now access:');
        console.log('   📝 Course Notes');
        console.log('   📄 PDF Downloads');
        console.log('   ⭐ All Pro Features');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function revokeProAccess(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email });
        
        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Revert to free plan
        user.subscription = {
            plan: 'free',
            status: 'active',
            startDate: new Date()
        };

        await user.save();

        console.log('\n✅ Pro access revoked');
        console.log('📧 User:', user.email);
        console.log('📦 Plan:', 'free');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function checkStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB\n');

        // Count users
        const totalUsers = await User.countDocuments();
        const proUsers = await User.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' });
        const freeUsers = totalUsers - proUsers;

        // Count courses and notes
        const totalCourses = await Course.countDocuments();
        const coursesWithNotes = await CourseNote.countDocuments({ isPublished: true });
        const totalNoteViews = await CourseNote.aggregate([
            { $group: { _id: null, total: { $sum: '$viewCount' } } }
        ]);
        const totalDownloads = await CourseNote.aggregate([
            { $group: { _id: null, total: { $sum: '$downloadCount' } } }
        ]);

        console.log('📊 SkillUp Buddy Statistics');
        console.log('=' .repeat(50));
        console.log('\n👥 Users:');
        console.log(`   Total: ${totalUsers}`);
        console.log(`   Pro: ${proUsers} (${((proUsers/totalUsers)*100).toFixed(1)}%)`);
        console.log(`   Free: ${freeUsers} (${((freeUsers/totalUsers)*100).toFixed(1)}%)`);
        
        console.log('\n📚 Courses:');
        console.log(`   Total Courses: ${totalCourses}`);
        console.log(`   Courses with Notes: ${coursesWithNotes}`);
        console.log(`   Coverage: ${((coursesWithNotes/totalCourses)*100).toFixed(1)}%`);
        
        console.log('\n📈 Engagement:');
        console.log(`   Total Note Views: ${totalNoteViews[0]?.total || 0}`);
        console.log(`   Total PDF Downloads: ${totalDownloads[0]?.total || 0}`);
        
        // Top viewed notes
        console.log('\n🔥 Top 5 Most Viewed Notes:');
        const topNotes = await CourseNote.find({ isPublished: true })
            .sort({ viewCount: -1 })
            .limit(5)
            .select('courseName viewCount downloadCount');
        
        topNotes.forEach((note, index) => {
            console.log(`   ${index + 1}. ${note.courseName}`);
            console.log(`      Views: ${note.viewCount} | Downloads: ${note.downloadCount}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function createSampleNotes(limit = 5) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB\n');

        // Get courses without notes
        const coursesWithNotes = await CourseNote.distinct('courseId');
        const courses = await Course.find({ 
            _id: { $nin: coursesWithNotes } 
        }).limit(limit);

        if (courses.length === 0) {
            console.log('✅ All courses already have notes!');
            process.exit(0);
        }

        console.log(`📝 Creating notes for ${courses.length} courses...\n`);

        for (const course of courses) {
            const note = new CourseNote({
                courseId: course._id.toString(),
                courseName: course.title,
                content: {
                    introduction: `Welcome to ${course.title}! This comprehensive guide will help you master ${course.topic}.`,
                    keyTopics: [
                        {
                            title: 'Getting Started',
                            description: 'Learn the fundamentals and set up your environment.'
                        },
                        {
                            title: 'Core Concepts',
                            description: 'Deep dive into the essential concepts and techniques.'
                        },
                        {
                            title: 'Advanced Topics',
                            description: 'Explore advanced features and best practices.'
                        },
                        {
                            title: 'Real-World Projects',
                            description: 'Build practical projects to solidify your learning.'
                        }
                    ],
                    learningObjectives: [
                        `Master the fundamentals of ${course.topic}`,
                        'Build real-world projects',
                        'Understand industry best practices',
                        'Develop problem-solving skills',
                        'Learn from expert instructors'
                    ],
                    prerequisites: [
                        'Basic computer literacy',
                        'Enthusiasm to learn',
                        'Time commitment for practice',
                        'Access to necessary tools'
                    ],
                    summary: `This ${course.difficulty || 'comprehensive'} course on ${course.topic} will take you from beginner to proficient. Perfect for ${course.students.toLocaleString()} students who have already enrolled!`,
                    resources: [
                        {
                            title: 'Course Link',
                            url: course.url,
                            type: course.type === 'free' ? 'video' : 'platform'
                        },
                        {
                            title: `${course.topic.charAt(0).toUpperCase() + course.topic.slice(1)} Documentation`,
                            url: `https://docs.${course.topic}.org`,
                            type: 'documentation'
                        }
                    ],
                    tips: [
                        'Practice daily for at least 30 minutes',
                        'Take detailed notes during lectures',
                        'Build projects to reinforce concepts',
                        'Join community forums for support',
                        'Review difficult topics multiple times',
                        'Apply concepts to solve real problems'
                    ]
                },
                isPublished: true
            });

            await note.save();
            console.log(`✅ Created notes for: ${course.title}`);
        }

        console.log(`\n🎉 Successfully created ${courses.length} course notes!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Command line interface
const command = process.argv[2];
const param = process.argv[3];

console.log('\n🚀 SkillUp Buddy Pro Features Testing Utility\n');

switch(command) {
    case 'grant':
        if (!param) {
            console.error('❌ Please provide user email');
            console.log('Usage: node test-pro-features.js grant user@example.com');
            process.exit(1);
        }
        grantProAccess(param);
        break;
    
    case 'revoke':
        if (!param) {
            console.error('❌ Please provide user email');
            console.log('Usage: node test-pro-features.js revoke user@example.com');
            process.exit(1);
        }
        revokeProAccess(param);
        break;
    
    case 'stats':
        checkStats();
        break;
    
    case 'create-notes':
        const limit = parseInt(param) || 5;
        createSampleNotes(limit);
        break;
    
    default:
        console.log('Available commands:\n');
        console.log('  grant <email>        - Grant Pro access to a user');
        console.log('  revoke <email>       - Revoke Pro access from a user');
        console.log('  stats                - Show platform statistics');
        console.log('  create-notes [count] - Create sample notes for courses (default: 5)');
        console.log('\nExamples:');
        console.log('  node test-pro-features.js grant user@example.com');
        console.log('  node test-pro-features.js revoke user@example.com');
        console.log('  node test-pro-features.js stats');
        console.log('  node test-pro-features.js create-notes 10');
        process.exit(0);
}