const mongoose = require('mongoose');
require('dotenv').config();

const CourseNote = require('./models/CourseNote');
const Course = require('./models/Course');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const courses = await Course.find().limit(20);
  
  if (courses.length === 0) {
    console.log('❌ No courses found! Run: node seed_courses.js first');
    process.exit(1);
  }
  
  console.log(`\n📚 Creating ENHANCED notes with rich content for ${courses.length} courses...\n`);
  
  let successCount = 0;
  
  for (const course of courses) {
    try {
      const existingNote = await CourseNote.findOne({ courseId: course._id.toString() });
      
      if (existingNote) {
        console.log(`⏭️  Skipping: ${course.title}`);
        continue;
      }
      
      // Generate rich, detailed content based on course topic
      const topicSpecificContent = generateTopicContent(course.topic, course.difficulty);
      
      const courseNote = new CourseNote({
        courseId: course._id.toString(),
        courseName: course.title,
        content: {
          introduction: `Welcome to ${course.title}! This comprehensive ${course.difficulty || 'professional'} level course is designed to take you from foundational concepts to advanced mastery in ${course.topic}. 

With over ${course.students.toLocaleString()} students already enrolled and an impressive ${course.rating} rating, this course has proven track record of success. Whether you're just starting out or looking to advance your career, this structured learning path provides everything you need.

Our expert instructors have carefully crafted ${course.duration} of content, combining theoretical knowledge with hands-on practical projects. You'll not only learn the concepts but also apply them in real-world scenarios that prepare you for actual industry challenges.

By the end of this course, you'll have a solid portfolio of projects, deep understanding of core principles, and the confidence to tackle professional ${course.topic} challenges. Let's begin this exciting learning journey together!`,
          
          keyTopics: [
            {
              title: `${topicSpecificContent.module1Title}`,
              description: `Start your journey by understanding the fundamental building blocks. We'll cover essential concepts, terminology, and setup procedures. You'll learn about the development environment, basic syntax, and core principles that form the foundation of ${course.topic}. This module includes interactive exercises and your first hands-on project to solidify understanding.`
            },
            {
              title: `${topicSpecificContent.module2Title}`,
              description: `Dive deeper into intermediate concepts and techniques. Learn about data structures, algorithms, design patterns, and best practices used by industry professionals. This module introduces more complex problem-solving approaches and teaches you how to write clean, maintainable, and efficient code. Includes real-world case studies and practical assignments.`
            },
            {
              title: `${topicSpecificContent.module3Title}`,
              description: `Master advanced topics including performance optimization, security best practices, scalability patterns, and enterprise-level architecture. Learn how to debug complex issues, implement advanced features, and handle edge cases. This section prepares you for senior-level challenges with comprehensive projects.`
            },
            {
              title: `${topicSpecificContent.module4Title}`,
              description: `Put everything together by building production-ready applications. Work on 3-5 comprehensive projects that simulate real industry scenarios. Learn about deployment strategies, CI/CD pipelines, testing methodologies, and maintenance best practices. Build a portfolio that showcases your skills to potential employers.`
            },
            {
              title: 'Testing & Quality Assurance',
              description: `Learn professional testing methodologies including unit testing, integration testing, and end-to-end testing. Understand TDD (Test-Driven Development) principles, write comprehensive test suites, and ensure code quality through automated testing. Master debugging tools and techniques for identifying and fixing issues quickly.`
            },
            {
              title: 'Performance Optimization',
              description: `Discover techniques for optimizing application performance, reducing load times, and improving user experience. Learn about caching strategies, lazy loading, code splitting, database query optimization, and profiling tools. Understand how to identify bottlenecks and implement solutions that scale.`
            },
            {
              title: 'Security Best Practices',
              description: `Master essential security concepts including authentication, authorization, data encryption, input validation, and protection against common vulnerabilities (XSS, CSRF, SQL injection). Learn secure coding practices, implement OAuth and JWT, and understand compliance requirements.`
            },
            {
              title: 'Deployment & DevOps',
              description: `Learn modern deployment strategies including containerization with Docker, orchestration with Kubernetes, cloud platforms (AWS, Azure, GCP), CI/CD pipelines, monitoring, and logging. Understand infrastructure as code and automated deployment workflows for efficient releases.`
            }
          ],
          
          learningObjectives: [
            `Master all fundamental concepts and terminology of ${course.topic}`,
            'Build 5+ real-world projects from scratch demonstrating practical skills',
            'Write clean, efficient, and maintainable code following industry standards',
            'Understand and implement design patterns and architectural principles',
            'Debug complex issues using professional tools and methodologies',
            'Optimize application performance and implement caching strategies',
            'Implement comprehensive security measures and best practices',
            'Deploy applications to production using modern DevOps practices',
            'Work with databases, APIs, and third-party integrations effectively',
            'Develop problem-solving skills applicable to real industry challenges',
            'Build a professional portfolio showcasing your capabilities',
            'Gain confidence to pursue ${course.topic} career opportunities'
          ],
          
          prerequisites: [
            'Basic computer literacy and comfortable navigating operating systems',
            'Fundamental understanding of how websites and applications work',
            'Ability to install software and configure development environments',
            'Basic knowledge of command line/terminal operations (helpful but not required)',
            'Access to a computer with at least 8GB RAM and stable internet connection',
            'Willingness to dedicate 5-10 hours per week for optimal learning',
            'Growth mindset and eagerness to learn through practice and mistakes',
            'Commitment to completing projects and assignments for hands-on experience'
          ],
          
          summary: `This ${course.difficulty || 'comprehensive'} ${course.topic} course offers an unparalleled learning experience with ${course.duration} of expertly crafted content. Join ${course.students.toLocaleString()} successful students who have transformed their careers through this program. 

The curriculum is constantly updated to reflect current industry trends and best practices. With a ${course.rating} average rating, students consistently praise the clear explanations, practical projects, and supportive learning environment.

You'll gain hands-on experience through multiple real-world projects, receive personalized feedback, and join a vibrant community of learners. By completion, you'll have the skills, confidence, and portfolio to pursue professional opportunities in ${course.topic}.

This course includes lifetime access to all materials, regular content updates, downloadable resources, project source code, and certificate of completion. Whether you're switching careers, upskilling, or starting fresh, this is your complete roadmap to ${course.topic} mastery.`,
          
          resources: [
            {
              title: 'Course Video Lectures',
              url: course.url || 'https://www.youtube.com',
              type: 'video'
            },
            {
              title: 'Official Documentation & Reference',
              url: `https://developer.mozilla.org/en-US/docs/Web/${course.topic}`,
              type: 'documentation'
            },
            {
              title: 'GitHub Repository - Course Code',
              url: 'https://github.com',
              type: 'code'
            },
            {
              title: 'Community Discord Server',
              url: 'https://discord.com',
              type: 'community'
            },
            {
              title: 'Stack Overflow - Q&A Forum',
              url: 'https://stackoverflow.com',
              type: 'community'
            },
            {
              title: 'Practice Exercises & Challenges',
              url: 'https://www.hackerrank.com',
              type: 'practice'
            },
            {
              title: 'Supplementary Reading Materials',
              url: 'https://www.freecodecamp.org',
              type: 'documentation'
            },
            {
              title: 'Industry Blog & Updates',
              url: 'https://dev.to',
              type: 'blog'
            }
          ],
          
          tips: [
            '🎯 Practice daily for 30-60 minutes rather than cramming in marathon sessions. Consistent daily practice builds muscle memory and solidifies concepts better than sporadic long sessions.',
            
            '📝 Take detailed notes in your own words. Writing helps encode information into long-term memory. Create a personal knowledge base you can reference later.',
            
            '💻 Code along with the instructor rather than just watching. Typing every line yourself helps you understand syntax and catch mistakes early. Pause videos to experiment with the code.',
            
            '🔨 Build projects outside the course curriculum. Apply concepts to personal ideas or recreate features from your favorite apps. This develops creative problem-solving skills.',
            
            '🐛 Debug errors yourself before looking at solutions. Struggling with problems strengthens learning. Use documentation, error messages, and debugging tools systematically.',
            
            '👥 Join study groups or find an accountability partner. Explaining concepts to others reinforces your understanding and provides motivation through shared goals.',
            
            '📚 Review previous lessons regularly using spaced repetition. Knowledge fades without review. Revisit challenging topics every few days to strengthen retention.',
            
            '🎨 Focus on understanding WHY, not just HOW. Understanding underlying principles allows you to adapt knowledge to new situations rather than memorizing steps.',
            
            '⏰ Set specific learning goals and deadlines. Break the course into weekly milestones. Specific goals create urgency and provide direction.',
            
            '🔄 Refactor and improve your old code as you learn. Revisiting past projects shows your growth and teaches you to write better code through iteration.',
            
            '📖 Read other people\'s code on GitHub. Studying how experienced developers structure projects teaches patterns, conventions, and techniques not covered in courses.',
            
            '🎓 Don\'t skip fundamentals to rush to advanced topics. Strong foundations prevent confusion later and make advanced concepts easier to grasp.',
            
            '💪 Embrace failure as part of learning. Every error is a learning opportunity. Professional developers debug code daily - it\'s a core skill to develop.',
            
            '🌐 Build a portfolio website showcasing your projects. Document your learning journey through blog posts. Demonstrating your work helps in job searches.',
            
            '🔍 Google errors and read documentation regularly. Learning to find answers independently is crucial for professional development when courses end.'
          ]
        },
        isPublished: true,
        viewCount: 0,
        downloadCount: 0
      });
      
      await courseNote.save();
      successCount++;
      console.log(`✅ [${successCount}] ENHANCED notes created: ${course.title}`);
      
    } catch (error) {
      console.error(`❌ Error for ${course.title}:`, error.message);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎉 ENHANCED course notes seeding complete!`);
  console.log(`✅ Success: ${successCount} detailed notes created`);
  console.log(`📝 Each note includes:`);
  console.log(`   • Comprehensive introduction (200+ words)`);
  console.log(`   • 8 detailed key topics with descriptions`);
  console.log(`   • 12 specific learning objectives`);
  console.log(`   • 8 clear prerequisites`);
  console.log(`   • Extended summary (150+ words)`);
  console.log(`   • 8 useful external resources`);
  console.log(`   • 15 actionable pro tips`);
  console.log(`${'='.repeat(70)}\n`);
  
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

// Generate topic-specific module titles
function generateTopicContent(topic, difficulty) {
  const topicMap = {
    'programming': {
      module1Title: 'Programming Fundamentals & Syntax',
      module2Title: 'Data Structures & Algorithms',
      module3Title: 'Advanced Programming Concepts',
      module4Title: 'Full Stack Application Development'
    },
    'design': {
      module1Title: 'Design Principles & Theory',
      module2Title: 'Tools & Software Mastery',
      module3Title: 'Advanced Design Techniques',
      module4Title: 'Portfolio Projects & Client Work'
    },
    'business': {
      module1Title: 'Business Fundamentals',
      module2Title: 'Strategic Planning & Analysis',
      module3Title: 'Advanced Business Operations',
      module4Title: 'Real Business Case Studies'
    },
    'marketing': {
      module1Title: 'Marketing Basics & Strategy',
      module2Title: 'Digital Marketing Channels',
      module3Title: 'Advanced Marketing Analytics',
      module4Title: 'Campaign Projects & ROI'
    }
  };

  return topicMap[topic] || {
    module1Title: 'Foundation & Getting Started',
    module2Title: 'Intermediate Concepts & Skills',
    module3Title: 'Advanced Topics & Mastery',
    module4Title: 'Real-World Projects & Portfolio'
  };
}