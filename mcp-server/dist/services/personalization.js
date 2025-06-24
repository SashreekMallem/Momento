export class PersonalizationEngine {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getCompleteUserProfile(userId) {
        const [profile, people, tastes, behavioralPatterns, missionStats] = await Promise.all([
            this.databaseService.getUserProfile(userId),
            this.databaseService.getUserPeople(userId),
            this.databaseService.getUserTastes(userId),
            this.databaseService.getBehavioralPatterns(userId),
            this.databaseService.getUserMissionStats(userId),
        ]);
        const insights = this.generateUserInsights(profile, people, tastes, behavioralPatterns, missionStats);
        return {
            basic: profile,
            relationships: people,
            preferences: tastes,
            behavioral: behavioralPatterns,
            performance: missionStats,
            insights,
        };
    }
    async updateUserPreferences(userId, preferences) {
        try {
            // Update user profile with new preferences
            const success = await this.databaseService.updateUserProfile(userId, {
                app_preferences: {
                    ...preferences,
                    lastUpdated: new Date().toISOString(),
                },
                personalization_score: await this.calculatePersonalizationScore(userId),
            });
            if (success) {
                // Update behavioral patterns based on preference changes
                await this.updateBehavioralPatternsFromPreferences(userId, preferences);
            }
            return success;
        }
        catch (error) {
            console.error('Error updating user preferences:', error);
            return false;
        }
    }
    generateUserInsights(profile, people, tastes, behavioralPatterns, missionStats) {
        const insights = {
            personalityTraits: this.inferPersonalityTraits(profile, tastes, behavioralPatterns),
            preferredActivities: this.inferPreferredActivities(tastes, missionStats),
            socialPreferences: this.inferSocialPreferences(profile, people),
            timePreferences: this.inferTimePreferences(profile, behavioralPatterns),
            engagementPatterns: this.analyzeEngagementPatterns(missionStats, behavioralPatterns),
        };
        return insights;
    }
    inferPersonalityTraits(profile, tastes, behavioralPatterns) {
        const traits = [];
        // Analyze life themes
        const lifeThemes = profile?.life_themes?.selectedThemes || [];
        if (lifeThemes.includes('adventure'))
            traits.push('adventurous');
        if (lifeThemes.includes('relationships'))
            traits.push('social');
        if (lifeThemes.includes('growth'))
            traits.push('growth-oriented');
        if (lifeThemes.includes('reflection'))
            traits.push('introspective');
        if (lifeThemes.includes('wellness'))
            traits.push('health-conscious');
        // Analyze music preferences
        if (tastes.music?.genres?.includes('classical'))
            traits.push('sophisticated');
        if (tastes.music?.genres?.includes('jazz'))
            traits.push('cultured');
        if (tastes.music?.genres?.includes('rock'))
            traits.push('energetic');
        if (tastes.music?.music_moods?.includes('Focus & Study'))
            traits.push('focused');
        // Analyze food preferences
        if (tastes.food?.cuisines?.length > 5)
            traits.push('culinary-adventurous');
        if (tastes.food?.dietary_restrictions?.length > 0)
            traits.push('health-conscious');
        if (tastes.food?.cooking_interests?.length > 0)
            traits.push('creative');
        // Analyze behavioral patterns
        behavioralPatterns.forEach(pattern => {
            if (pattern.pattern_type === 'consistency' && pattern.confidence_score > 0.8) {
                traits.push('consistent');
            }
            if (pattern.pattern_type === 'variety_seeking' && pattern.confidence_score > 0.8) {
                traits.push('variety-seeking');
            }
        });
        return [...new Set(traits)]; // Remove duplicates
    }
    inferPreferredActivities(tastes, missionStats) {
        const activities = [];
        // From taste preferences
        if (tastes.music?.favorite_artists?.length > 0)
            activities.push('music-listening');
        if (tastes.music?.music_moods?.includes('💪 Energetic & Pumped'))
            activities.push('exercise');
        if (tastes.food?.cooking_interests?.length > 0)
            activities.push('cooking');
        if (tastes.movie?.genres?.includes('documentary'))
            activities.push('learning');
        // From mission performance
        if (missionStats?.typeStats) {
            const preferredTypes = Object.entries(missionStats.typeStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type]) => type);
            activities.push(...preferredTypes);
        }
        return activities;
    }
    inferSocialPreferences(profile, people) {
        const coupleHub = profile?.life_themes?.coupleHub;
        const familyMode = profile?.life_themes?.familyMode;
        const peopleCount = people.length;
        if (coupleHub && familyMode)
            return 'family-oriented';
        if (coupleHub)
            return 'couple-focused';
        if (peopleCount > 10)
            return 'highly-social';
        if (peopleCount > 5)
            return 'social';
        if (peopleCount > 0)
            return 'selective-social';
        return 'independent';
    }
    inferTimePreferences(profile, behavioralPatterns) {
        const preferences = [];
        const timeCommitment = profile?.life_themes?.timeCommitment;
        if (timeCommitment === 'light')
            preferences.push('short-sessions');
        if (timeCommitment === 'moderate')
            preferences.push('medium-sessions');
        if (timeCommitment === 'deep')
            preferences.push('long-sessions');
        // Analyze behavioral patterns for time-based preferences
        behavioralPatterns.forEach(pattern => {
            if (pattern.pattern_type === 'peak_activity_time') {
                const timeData = pattern.pattern_data;
                if (timeData.morning_activity > 0.7)
                    preferences.push('morning-person');
                if (timeData.evening_activity > 0.7)
                    preferences.push('evening-person');
            }
        });
        return preferences;
    }
    analyzeEngagementPatterns(missionStats, behavioralPatterns) {
        return {
            averageEngagement: missionStats?.avgEngagement || 0,
            completionRate: missionStats?.completionRate || 0,
            preferredDifficulty: this.getPreferredDifficulty(missionStats),
            consistencyScore: this.calculateConsistencyScore(behavioralPatterns),
            motivationFactors: this.identifyMotivationFactors(behavioralPatterns),
        };
    }
    getPreferredDifficulty(missionStats) {
        if (!missionStats?.difficultyStats)
            return 'beginner';
        const difficulties = Object.entries(missionStats.difficultyStats)
            .sort(([, a], [, b]) => b - a);
        return difficulties[0]?.[0] || 'beginner';
    }
    calculateConsistencyScore(behavioralPatterns) {
        const consistencyPattern = behavioralPatterns.find(p => p.pattern_type === 'consistency');
        return consistencyPattern?.confidence_score || 0.5;
    }
    identifyMotivationFactors(behavioralPatterns) {
        const factors = [];
        behavioralPatterns.forEach(pattern => {
            if (pattern.pattern_type === 'completion_triggers' && pattern.confidence_score > 0.7) {
                const triggers = pattern.pattern_data.triggers || [];
                factors.push(...triggers);
            }
        });
        return factors;
    }
    async calculatePersonalizationScore(userId) {
        const [profile, people, tastes, events] = await Promise.all([
            this.databaseService.getUserProfile(userId),
            this.databaseService.getUserPeople(userId),
            this.databaseService.getUserTastes(userId),
            this.databaseService.getUserEvents(userId, 'month'),
        ]);
        let score = 0;
        // Profile completeness (40%)
        if (profile?.life_themes)
            score += 0.1;
        if (profile?.onboarding_completed)
            score += 0.1;
        if (profile?.location)
            score += 0.05;
        if (profile?.timezone)
            score += 0.05;
        if (profile?.notification_preferences)
            score += 0.1;
        // Relationship data (25%)
        if (people.length > 0)
            score += 0.1;
        if (people.length > 3)
            score += 0.1;
        if (people.some((p) => p.person_interests?.length > 0))
            score += 0.05;
        // Taste preferences (25%)
        if (tastes.music?.genres?.length > 0)
            score += 0.08;
        if (tastes.food?.cuisines?.length > 0)
            score += 0.08;
        if (tastes.movie?.genres?.length > 0)
            score += 0.09;
        // Activity and engagement (10%)
        if (events.length > 10)
            score += 0.05;
        if (events.length > 50)
            score += 0.05;
        return Math.min(score, 1.0); // Cap at 1.0
    }
    async updateBehavioralPatternsFromPreferences(userId, preferences) {
        // Analyze preference changes and update behavioral patterns
        const timestamp = new Date().toISOString();
        if (preferences.theme) {
            await this.databaseService.updateBehavioralPattern(userId, 'ui_preferences', {
                theme: preferences.theme,
                updatedAt: timestamp,
            }, 0.9);
        }
        if (preferences.notificationTiming) {
            await this.databaseService.updateBehavioralPattern(userId, 'notification_preferences', {
                preferredTimes: preferences.notificationTiming,
                updatedAt: timestamp,
            }, 0.85);
        }
        // Update general preference evolution pattern
        await this.databaseService.updateBehavioralPattern(userId, 'preference_evolution', {
            lastUpdate: timestamp,
            changes: Object.keys(preferences),
            updateFrequency: 'monthly', // This could be calculated
        }, 0.8);
    }
    async adaptUserExperience(userId) {
        const profile = await this.getCompleteUserProfile(userId);
        return {
            recommendedMissionTypes: this.getRecommendedMissionTypes(profile),
            optimalScheduling: this.getOptimalScheduling(profile),
            personalizedUI: this.getPersonalizedUISettings(profile),
            communicationStyle: this.getPreferredCommunicationStyle(profile),
        };
    }
    getRecommendedMissionTypes(profile) {
        const types = [];
        if (profile.insights.personalityTraits.includes('social')) {
            types.push('connection');
        }
        if (profile.insights.personalityTraits.includes('adventurous')) {
            types.push('adventure', 'experience');
        }
        if (profile.insights.personalityTraits.includes('growth-oriented')) {
            types.push('learning', 'reflection');
        }
        if (profile.insights.personalityTraits.includes('creative')) {
            types.push('creativity');
        }
        return types;
    }
    getOptimalScheduling(profile) {
        return {
            preferredTimes: profile.insights.timePreferences,
            sessionLength: profile.basic?.life_themes?.timeCommitment || 'moderate',
            frequency: this.calculateOptimalFrequency(profile),
            flexibility: profile.insights.engagementPatterns.consistencyScore > 0.7 ? 'scheduled' : 'flexible',
        };
    }
    getPersonalizedUISettings(profile) {
        return {
            theme: profile.insights.personalityTraits.includes('sophisticated') ? 'elegant' : 'vibrant',
            complexity: profile.basic?.engagement_score > 0.8 ? 'advanced' : 'simple',
            notifications: profile.insights.engagementPatterns.consistencyScore > 0.7 ? 'regular' : 'minimal',
        };
    }
    getPreferredCommunicationStyle(profile) {
        if (profile.insights.personalityTraits.includes('introspective')) {
            return 'thoughtful';
        }
        if (profile.insights.personalityTraits.includes('energetic')) {
            return 'enthusiastic';
        }
        if (profile.insights.personalityTraits.includes('sophisticated')) {
            return 'elegant';
        }
        return 'friendly';
    }
    calculateOptimalFrequency(profile) {
        const engagement = profile.performance?.avgEngagement || 0;
        const consistency = profile.insights.engagementPatterns.consistencyScore;
        if (engagement > 0.8 && consistency > 0.7)
            return 'daily';
        if (engagement > 0.6 && consistency > 0.5)
            return 'every-other-day';
        if (engagement > 0.4)
            return 'weekly';
        return 'bi-weekly';
    }
}
//# sourceMappingURL=personalization.js.map