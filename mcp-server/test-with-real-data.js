#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from './dist/services/database.js';
import { EnhancedMissionGenerator } from './dist/services/enhanced-mission-generator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testWithRealData() {
  console.log('🔍 Testing Mission Generation with Real Database Data');
  console.log('=====================================================');

  try {
    // Initialize services
    const databaseService = new DatabaseService();
    const missionGenerator = new EnhancedMissionGenerator(databaseService);
    console.log('🧠 Using mission generator:', missionGenerator.constructor.name);
    if (missionGenerator.getDebugInfo) {
      console.log('🔍 Mission generator debug info:', missionGenerator.getDebugInfo());
    }

    // First, let's see what users we have in the database
    console.log('\n📊 Checking existing users...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all users with profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        display_name,
        onboarding_completed,
        life_themes,
        personalization_score
      `)
      .eq('onboarding_completed', true)
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users with completed onboarding found in database');
      console.log('💡 Make sure you have completed the mobile app onboarding first');
      return;
    }

    console.log(`✅ Found ${users.length} users with completed onboarding:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.display_name || 'Unknown'} (ID: ${user.user_id.substring(0, 8)}...)`);
      console.log(`     Personalization Score: ${user.personalization_score}`);
      console.log(`     Life Themes: ${user.life_themes ? Object.keys(user.life_themes).length : 0} themes`);
    });

    // Prompt user to select which user to test
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let testUser = users[0];
    if (users.length > 1) {
      const answer = await new Promise(resolve => {
        rl.question(`\nSelect user to test (1-${users.length}, default 1): `, resolve);
      });
      const idx = parseInt(answer, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= users.length) {
        testUser = users[idx - 1];
      }
    }
    rl.close();
    console.log(`\n🎯 Testing mission generation for: ${testUser.display_name || 'Test User'}`);
    console.log(`   User ID: ${testUser.user_id}`);

    // Get detailed user profile
    console.log('\n📋 Fetching detailed user profile...');
    const userProfile = await databaseService.getUserProfile(testUser.user_id);
    
    if (!userProfile) {
      console.log('❌ Could not fetch user profile');
      return;
    }

    console.log('✅ User Profile Retrieved:');
    console.log(`   Display Name: ${userProfile.display_name || 'Not set'}`);
    console.log(`   Onboarding Completed: ${userProfile.onboarding_completed}`);
    console.log(`   Engagement Score: ${userProfile.engagement_score}`);
    console.log(`   Personalization Score: ${userProfile.personalization_score}`);

    // Get user's people
    const people = await databaseService.getUserPeople(testUser.user_id);
    console.log(`   Important People: ${people.length} people`);
    if (people.length > 0) {
      people.slice(0, 3).forEach(person => {
        console.log(`     - ${person.name} (${person.relationship})`);
      });
    }

    // Get user's tastes
    const tastes = await databaseService.getUserTastes(testUser.user_id);
    console.log('   Taste Profiles:');
    console.log(`     Music: ${tastes.music ? 'Yes' : 'No'}`);
    console.log(`     Food: ${tastes.food ? 'Yes' : 'No'}`);
    console.log(`     Movies: ${tastes.movie ? 'Yes' : 'No'}`);

    if (tastes.music) {
      console.log(`     Music Genres: ${tastes.music.genres?.slice(0, 3).join(', ') || 'None'}`);
    }
    if (tastes.food) {
      console.log(`     Food Cuisines: ${tastes.food.cuisines?.slice(0, 3).join(', ') || 'None'}`);
    }
    if (tastes.movie) {
      console.log(`     Movie Genres: ${tastes.movie.genres?.slice(0, 3).join(', ') || 'None'}`);
    }

    // Now test mission generation
    console.log('\n🚀 Generating Mission...');
    console.log('===============================');

    const missionPreferences = {
      missionType: 'experience',
      difficulty: 'beginner',
      duration: 30,
      context: 'Weekend afternoon activity'
    };

    const startTime = Date.now();
    const missions = await missionGenerator.generateMission(testUser.user_id, missionPreferences);
    const generationTime = Date.now() - startTime;

    if (missions && Array.isArray(missions) && missions.length > 0) {
      console.log(`✅ ${missions.length} Missions Generated Successfully!`);
      console.log(`   Generation Time: ${generationTime}ms`);
      missions.forEach((mission, idx) => {
        console.log(`\n--- Mission #${idx + 1} ---`);
        console.log(`   Mission ID: ${mission.id}`);
        console.log(`   Title: ${mission.title}`);
        console.log(`   Type: ${mission.mission_type}`);
        console.log(`   Category: ${mission.mission_category}`);
        console.log(`   Difficulty: ${mission.difficulty}`);
        console.log(`   Duration: ${mission.estimated_duration} minutes`);
        console.log(`   Description: ${mission.description}`);
        if (mission.source) {
          console.log(`   Source: ${mission.source}`);
        } else if (mission.generation_model) {
          console.log(`   Source: LLM (${mission.generation_model})`);
        } else {
          console.log('   Source: (unknown, possibly fallback template)');
        }
        if (mission.personalized_elements) {
          console.log('   Personalized Elements:');
          console.log(`     ${JSON.stringify(mission.personalized_elements, null, 6)}`);
        }
        if (mission.learning_objectives && mission.learning_objectives.length > 0) {
          console.log(`   Learning Objectives: ${mission.learning_objectives.join(', ')}`);
        }
        if (mission.required_resources && mission.required_resources.length > 0) {
          console.log(`   Required Resources: ${mission.required_resources.join(', ')}`);
        }
        if (mission.generation_model) {
          console.log(`   Generation Model: ${mission.generation_model}`);
        }
        if (mission.generation_cost) {
          console.log(`   Generation Cost: $${mission.generation_cost?.toFixed(6)}`);
        }
        if (mission.completion_likelihood) {
          console.log(`   Completion Likelihood: ${mission.completion_likelihood}`);
        }
      });
      console.log('\n🎉 Mission generation test completed successfully!');
    } else {
      console.log('❌ Mission generation failed - no missions returned');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testWithRealData()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
