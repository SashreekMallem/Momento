import { DatabaseService } from './database.js';
export declare class EnhancedMissionGenerator {
    private openai?;
    private databaseService;
    private profileCache;
    constructor(databaseService: DatabaseService);
    generateMission(userId: string, preferences?: any): Promise<(import("./database.js").Mission | null)[]>;
    private getOptimizedProfile;
    private generateCondensedProfile;
    private generateProfileSummaries;
    private buildOptimizedPrompt;
    private generateWithMinimalTokens;
    private isCacheFresh;
    private trackCacheHit;
    private storeCacheInDatabase;
    private calculateCost;
    getCacheStats(): Promise<any>;
    generateLifeChapterStory(lifeChapter: any): Promise<{
        summary: string;
        story: string;
    }>;
}
export default EnhancedMissionGenerator;
//# sourceMappingURL=enhanced-mission-generator.d.ts.map