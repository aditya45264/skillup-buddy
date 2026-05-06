// js/recommendationEngine.js - ENHANCED VERSION

const RecommendationEngine = {
  
  getQuizResults() {
    const quizData = localStorage.getItem('skillsQuizResults');
    if (!quizData) return null;
    
    try {
      return JSON.parse(quizData);
    } catch (error) {
      console.error('Error parsing quiz results:', error);
      return null;
    }
  },

  extractPreferences(quizResults) {
    if (!quizResults || !quizResults.answers) return null;

    const answers = quizResults.answers;
    
    return {
      skillLevel: answers[1] || 'beginner',
      learningGoal: answers[2] || '',
      interests: Array.isArray(answers[3]) ? answers[3] : [],
      learningStyle: answers[4] || '',
      timeCommitment: answers[5] || '',
      budget: answers[6] || '',
      experience: answers[7] || '',
      tools: Array.isArray(answers[8]) ? answers[8] : [],
      certificationInterest: answers[9] || '',
      supportPreference: answers[10] || ''
    };
  },

  mapInterestToTopics(interests) {
    const topicMapping = {
      'web-dev': ['programming'],
      'mobile-dev': ['programming'],
      'data-science': ['programming'],
      'design': ['design'],
      'devops': ['programming'],
      'cybersecurity': ['programming'],
      'programming': ['programming'],
      'business': ['business'],
      'marketing': ['marketing']
    };

    const topics = new Set();
    interests.forEach(interest => {
      const mappedTopics = topicMapping[interest] || [];
      mappedTopics.forEach(topic => topics.add(topic));
    });

    return Array.from(topics);
  },

  mapSkillToDifficulty(skillLevel) {
    const difficultyMapping = {
      'beginner': ['beginner'],
      'some-basics': ['beginner', 'intermediate'],
      'intermediate': ['intermediate', 'advanced'],
      'advanced': ['advanced'],
      'expert': ['advanced']
    };

    return difficultyMapping[skillLevel] || ['beginner', 'intermediate'];
  },

  mapTimeToDuration(timeCommitment) {
    const durationMapping = {
      '1-3-hours': { max: 10 },
      '4-7-hours': { max: 20 },
      '8-15-hours': { max: 40 },
      '15-plus': { max: 999 }
    };

    return durationMapping[timeCommitment] || { max: 999 };
  },

  filterCourses(courses, preferences) {
    if (!preferences) return courses;

    return courses.filter(course => {
      if (preferences.budget === 'free-only' && course.type !== 'free') {
        return false;
      }
      if (preferences.budget === 'under-500' && course.price > 500) {
        return false;
      }
      if (preferences.budget === '500-2000' && (course.price < 500 || course.price > 2000)) {
        return false;
      }

      const relevantTopics = this.mapInterestToTopics(preferences.interests);
      if (relevantTopics.length > 0 && !relevantTopics.includes(course.topic)) {
        return false;
      }

      const suitableDifficulties = this.mapSkillToDifficulty(preferences.skillLevel);
      if (course.difficulty && !suitableDifficulties.includes(course.difficulty)) {
        return false;
      }

      return true;
    });
  },

  scoreCourses(courses, preferences) {
    return courses.map(course => {
      let score = 0;

      const relevantTopics = this.mapInterestToTopics(preferences.interests);
      if (relevantTopics.includes(course.topic)) {
        score += 50;
      }

      const suitableDifficulties = this.mapSkillToDifficulty(preferences.skillLevel);
      if (suitableDifficulties.includes(course.difficulty)) {
        score += 30;
      }

      if (preferences.budget === 'free-only' && course.type === 'free') {
        score += 20;
      } else if (course.price <= 2000 && preferences.budget !== 'free-only') {
        score += 10;
      }

      if (preferences.learningGoal === 'career-change' && course.difficulty === 'beginner') {
        score += 15;
      }
      if (preferences.learningGoal === 'skill-upgrade' && course.difficulty !== 'beginner') {
        score += 15;
      }

      score += course.rating * 5;

      if (course.students > 100000) {
        score += 10;
      }

      return { ...course, relevanceScore: score };
    });
  },

  async getRecommendations(allCourses) {
    // FIXED: Better error handling
    if (!allCourses || allCourses.length === 0) {
      console.error('❌ No courses provided to recommendation engine');
      return [];
    }

    const quizResults = this.getQuizResults();
    
    if (!quizResults) {
      console.warn('⚠️ No quiz results found. Returning all courses sorted by rating.');
      return allCourses.sort((a, b) => b.rating - a.rating);
    }

    const preferences = this.extractPreferences(quizResults);
    if (!preferences) {
      console.warn('⚠️ Could not extract preferences. Returning all courses.');
      return allCourses.sort((a, b) => b.rating - a.rating);
    }

    console.log('📊 User Preferences:', preferences);

    const filteredCourses = this.filterCourses(allCourses, preferences);
    console.log(`✅ Filtered: ${filteredCourses.length} courses match preferences`);

    if (filteredCourses.length === 0) {
      console.warn('⚠️ No courses match preferences. Showing all courses.');
      return allCourses.sort((a, b) => b.rating - a.rating);
    }

    const scoredCourses = this.scoreCourses(filteredCourses, preferences);
    const sortedCourses = scoredCourses.sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log('🎯 Top 5 Recommendations:', sortedCourses.slice(0, 5).map(c => ({
      title: c.title,
      score: c.relevanceScore,
      topic: c.topic,
      difficulty: c.difficulty
    })));

    return sortedCourses;
  },

  async getRecommendationsByType(allCourses, type) {
    const recommendations = await this.getRecommendations(allCourses);
    return recommendations.filter(course => course.type === type);
  },

  hasCompletedQuiz() {
    const quizResults = this.getQuizResults();
    return quizResults && quizResults.completedAt;
  },

  getRecommendationSummary() {
    const quizResults = this.getQuizResults();
    if (!quizResults) return null;

    const preferences = this.extractPreferences(quizResults);
    if (!preferences) return null;

    return {
      skillLevel: preferences.skillLevel,
      interests: preferences.interests,
      budget: preferences.budget,
      learningGoal: preferences.learningGoal,
      recommendationCount: 0
    };
  }
};

window.RecommendationEngine = RecommendationEngine;