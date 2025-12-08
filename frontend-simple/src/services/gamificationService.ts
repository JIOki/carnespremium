import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// ==================== TYPES ====================

export interface LoyaltyPoints {
  id: string;
  userId: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  tierProgress: number;
  nextTierPoints: number;
  totalBadges: number;
  totalChallengesCompleted: number;
  totalReferrals: number;
  currentStreak: number;
  longestStreak: number;
}

export interface TierConfig {
  key: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  discount: number;
  pointsMultiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: string;
  action: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  multiplier: number;
  bonusPoints: number;
  description: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirementType: string;
  requirementValue?: number;
  pointsReward: number;
  hasSpecialReward: boolean;
  specialRewardDesc?: string;
  isSecret: boolean;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  isNew: boolean;
  earnedAt: string;
}

export interface BadgeStats {
  total: number;
  totalAvailable: number;
  completionPercentage: number;
  earnedByRarity: {
    COMMON: number;
    RARE: number;
    EPIC: number;
    LEGENDARY: number;
  };
  totalPointsFromBadges: number;
  newBadgesCount: number;
  recentBadges: Badge[];
  categories: {
    [key: string]: {
      earned: number;
      total: number;
    };
  };
}

export interface Challenge {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL' | 'ONE_TIME';
  category: string;
  targetType: string;
  targetValue: number;
  pointsReward: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  icon?: string;
  color?: string;
  startDate: string;
  endDate?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
    isCompleted: boolean;
    completedAt?: string;
    rewardClaimed: boolean;
  };
}

export interface Referral {
  email: string;
  status: string;
  pointsEarned: number;
  registeredAt?: string;
  firstPurchaseAt?: string;
  firstPurchaseAmount?: number;
}

export interface ReferralStats {
  total: number;
  registered: number;
  converted: number;
  pending: number;
  totalPointsEarned: number;
  conversionRate: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  shortDesc?: string;
  type: 'DISCOUNT' | 'FREE_PRODUCT' | 'FREE_SHIPPING' | 'EXCLUSIVE_ACCESS' | 'PHYSICAL_REWARD';
  pointsCost: number;
  discountType?: string;
  discountValue?: number;
  imageUrl?: string;
  icon?: string;
  color?: string;
  featured: boolean;
  requiresTier?: string;
  canAfford?: boolean;
  userPoints?: number;
}

export interface RewardRedemption {
  id: string;
  reward: Reward;
  pointsSpent: number;
  status: string;
  generatedCode?: string;
  deliveryStatus?: string;
  createdAt: string;
}

export interface DashboardData {
  loyalty: {
    loyalty: LoyaltyPoints;
    currentTier: TierConfig & { key: string };
    nextTier?: TierConfig & { key: string; pointsNeeded: number };
    stats: any;
  };
  badges: BadgeStats;
  challenges: {
    active: Challenge[];
    stats: {
      totalCompleted: number;
      activeCount: number;
    };
  };
  referrals: ReferralStats;
  recentRedemptions: RewardRedemption[];
}

// ==================== SERVICE ====================

class GamificationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  // ==================== LOYALTY ====================

  async getLoyaltyStats() {
    const response = await axios.get(`${API_URL}/gamification/loyalty`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getLoyaltyTransactions(params?: { limit?: number; offset?: number; type?: string }) {
    const response = await axios.get(`${API_URL}/gamification/loyalty/transactions`, {
      headers: this.getAuthHeader(),
      params
    });
    return response.data.data;
  }

  async getAllTiers() {
    const response = await axios.get(`${API_URL}/gamification/tiers`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.tiers;
  }

  // ==================== BADGES ====================

  async getAllBadges(): Promise<Badge[]> {
    const response = await axios.get(`${API_URL}/gamification/badges`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.badges;
  }

  async getMyBadges(): Promise<{ badges: UserBadge[]; stats: BadgeStats }> {
    const response = await axios.get(`${API_URL}/gamification/badges/my`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getNextBadges(): Promise<Badge[]> {
    const response = await axios.get(`${API_URL}/gamification/badges/next`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.badges;
  }

  async markBadgesAsViewed() {
    const response = await axios.post(
      `${API_URL}/gamification/badges/mark-viewed`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async getBadgeLeaderboard(limit = 10) {
    const response = await axios.get(`${API_URL}/gamification/badges/leaderboard`, {
      headers: this.getAuthHeader(),
      params: { limit }
    });
    return response.data.data.leaderboard;
  }

  // ==================== CHALLENGES ====================

  async getChallenges(): Promise<{
    active: Challenge[];
    completed: any[];
    stats: any;
  }> {
    const response = await axios.get(`${API_URL}/gamification/challenges`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getActiveChallenges(type?: string): Promise<Challenge[]> {
    const response = await axios.get(`${API_URL}/gamification/challenges/active`, {
      headers: this.getAuthHeader(),
      params: { type }
    });
    return response.data.data.challenges;
  }

  async claimChallengeReward(challengeId: string) {
    const response = await axios.post(
      `${API_URL}/gamification/challenges/${challengeId}/claim`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  // ==================== REFERRALS ====================

  async getMyReferralCode(): Promise<{ code: string; link: string }> {
    const response = await axios.get(`${API_URL}/gamification/referrals/my-code`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getReferralStats(): Promise<{ stats: ReferralStats; referrals: Referral[] }> {
    const response = await axios.get(`${API_URL}/gamification/referrals/stats`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async trackReferralClick(code: string) {
    await axios.post(`${API_URL}/gamification/referrals/track-click`, { code });
  }

  async getReferralQR() {
    const response = await axios.get(`${API_URL}/gamification/referrals/qr`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  // ==================== REWARDS ====================

  async getAvailableRewards(): Promise<Reward[]> {
    const response = await axios.get(`${API_URL}/gamification/rewards`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.rewards;
  }

  async getRewardById(rewardId: string): Promise<Reward> {
    const response = await axios.get(`${API_URL}/gamification/rewards/${rewardId}`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.reward;
  }

  async redeemReward(rewardId: string) {
    const response = await axios.post(
      `${API_URL}/gamification/rewards/${rewardId}/redeem`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async getMyRedemptions(): Promise<RewardRedemption[]> {
    const response = await axios.get(`${API_URL}/gamification/rewards/my-redemptions`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.redemptions;
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(type: string, params?: { period?: string; limit?: number }) {
    const response = await axios.get(`${API_URL}/gamification/leaderboard/${type}`, {
      headers: this.getAuthHeader(),
      params
    });
    return response.data.data;
  }

  async getTopReferrers(limit = 10) {
    const response = await axios.get(`${API_URL}/gamification/leaderboard/top-referrers`, {
      headers: this.getAuthHeader(),
      params: { limit }
    });
    return response.data.data.leaderboard;
  }

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<DashboardData> {
    const response = await axios.get(`${API_URL}/gamification/dashboard`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  // ==================== ADMIN ====================

  async getAdminOverview() {
    const response = await axios.get(`${API_URL}/gamification/admin/overview`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async initializeBadges() {
    const response = await axios.post(
      `${API_URL}/gamification/admin/badges/initialize`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async generateDailyChallenges() {
    const response = await axios.post(
      `${API_URL}/gamification/admin/challenges/generate-daily`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async generateWeeklyChallenges() {
    const response = await axios.post(
      `${API_URL}/gamification/admin/challenges/generate-weekly`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async getChallengeStats() {
    const response = await axios.get(`${API_URL}/gamification/admin/challenges/stats`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getRewardStats() {
    const response = await axios.get(`${API_URL}/gamification/admin/rewards/stats`, {
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async getPendingRedemptions() {
    const response = await axios.get(`${API_URL}/gamification/admin/redemptions/pending`, {
      headers: this.getAuthHeader()
    });
    return response.data.data.redemptions;
  }

  async approveRedemption(redemptionId: string) {
    const response = await axios.post(
      `${API_URL}/gamification/admin/redemptions/${redemptionId}/approve`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async markRedemptionDelivered(redemptionId: string, trackingInfo?: any) {
    const response = await axios.post(
      `${API_URL}/gamification/admin/redemptions/${redemptionId}/deliver`,
      { trackingInfo },
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async cancelRedemption(redemptionId: string, reason: string, refund = true) {
    const response = await axios.post(
      `${API_URL}/gamification/admin/redemptions/${redemptionId}/cancel`,
      { reason, refund },
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }

  async adjustPoints(userId: string, points: number, reason: string) {
    const response = await axios.post(
      `${API_URL}/gamification/admin/points/adjust`,
      { userId, points, reason },
      { headers: this.getAuthHeader() }
    );
    return response.data.data;
  }
}

export default new GamificationService();
