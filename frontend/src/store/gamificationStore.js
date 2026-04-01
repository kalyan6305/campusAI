import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const LEVELS = [
  { name: 'Fresher', threshold: 0 },
  { name: 'Intern', threshold: 500 },
  { name: 'Developer', threshold: 2000 },
  { name: 'Expert', threshold: 5000 },
];

export const BADGES = {
  FIRST_ANSWER: { id: 'first_answer', name: 'First Steps', description: 'Answered your first question.', icon: 'Flag' },
  STREAK_3: { id: 'streak_3', name: 'Consistent Learner', description: 'Maintained a 3-day streak.', icon: 'Flame' },
  STREAK_7: { id: 'streak_7', name: 'Unstoppable', description: 'Maintained a 7-day streak.', icon: 'Flame' },
  GOOGLE_CHALLENGER: { id: 'google_challenger', name: 'Google Challenger', description: 'Practiced a Google round.', icon: 'Target' },
  AMAZON_PRACTICE: { id: 'amazon_practice', name: 'Amazon Practice', description: 'Practiced an Amazon round.', icon: 'Target' },
  MOCK_MASTER: { id: 'mock_master', name: 'Mock Master', description: 'Completed a full mock interview.', icon: 'Trophy' },
  DSA_MASTER: { id: 'dsa_master', name: 'DSA Master', description: 'Excellent performance in technical rounds.', icon: 'Terminal' },
  HR_EXPERT: { id: 'hr_expert', name: 'HR Expert', description: 'Excellent performance in HR/Behavioral rounds.', icon: 'Users' }
};

export const useGamificationStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      level: LEVELS[0],
      streak: 0,
      lastActiveDate: null,
      lastChallengesReset: null,
      badges: [],
      dailyChallenges: [
        { id: 1, text: 'Answer 5 questions', progress: 0, target: 5, completed: false, xpReward: 50 },
        { id: 2, text: 'Complete a round/mock', progress: 0, target: 1, completed: false, xpReward: 100 },
        { id: 3, text: 'Practice a company-specific round', progress: 0, target: 1, completed: false, xpReward: 50 }
      ],
      notifications: [], 
      campaignProgress: [1], // IDs of completed levels
      powerups: {
        freeze: 2,
        fiftyFifty: 2,
        revive: 1
      },

      addNotification: (msg) => {
          const id = Date.now() + Math.random();
          set((state) => ({
              notifications: [...state.notifications, { id, ...msg }]
          }));
          setTimeout(() => {
              set((state) => ({
                  notifications: state.notifications.filter(n => n.id !== id)
              }));
          }, 4000);
      },

      completeCampaignLevel: (levelId) => {
        set((state) => {
          if (state.campaignProgress.includes(levelId)) return state;
          const nextLevelId = levelId + 1;
          const updatedProgress = [...state.campaignProgress, nextLevelId];
          get().addNotification({ type: 'challenge', message: `Level ${levelId} Mastered! Next Level Unlocked.` });
          return { campaignProgress: updatedProgress };
        });
      },

      purchasePowerup: (type) => {
        const costs = { freeze: 200, fiftyFifty: 300, revive: 500 };
        const cost = costs[type];
        if (get().xp < cost) {
          get().addNotification({ type: 'notification', message: `Not enough XP! Need ${cost} XP.` });
          return false;
        }
        set((state) => ({
          xp: state.xp - cost,
          powerups: { ...state.powerups, [type]: state.powerups[type] + 1 }
        }));
        get().addNotification({ type: 'xp', message: `Purchased ${type}! -${cost} XP` });
        return true;
      },

      usePowerup: (type) => {
        set((state) => {
          if (state.powerups[type] <= 0) return state;
          return {
            powerups: { ...state.powerups, [type]: state.powerups[type] - 1 }
          };
        });
      },

      addXP: (amount, reason) => {
        set((state) => {
          let newXP = state.xp + amount;
          let newLevel = state.level;
          let levelUp = false;

          for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (newXP >= LEVELS[i].threshold) {
              if (state.level.name !== LEVELS[i].name) {
                newLevel = LEVELS[i];
                levelUp = true;
              }
              break;
            }
          }

          if (levelUp) {
             get().addNotification({ type: 'level', message: `Level Up! ${newLevel.name}` });
          } else {
             get().addNotification({ type: 'xp', message: `+${amount} XP: ${reason}` });
          }

          return { xp: newXP, level: newLevel };
        });
      },

      awardBadge: (badgeKey) => {
        set((state) => {
          const badge = BADGES[badgeKey];
          if (!badge || state.badges.find(b => b.id === badge.id)) return state;
          
          get().addNotification({ type: 'badge', message: `Badge Unlocked: ${badge.name}` });
          return { badges: [...state.badges, badge] };
        });
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          if (state.lastActiveDate === today) return state;

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = state.streak;
          if (state.lastActiveDate === yesterdayStr) {
            newStreak += 1;
            get().addNotification({ type: 'streak', message: `${newStreak} Day Streak!` });
            get().addXP(10 * newStreak, 'Streak Bonus');
          } else {
            newStreak = 1;
            get().addNotification({ type: 'streak', message: `Started a new streak!` });
          }

          if (newStreak >= 3) get().awardBadge('STREAK_3');
          if (newStreak >= 7) get().awardBadge('STREAK_7');

          return { lastActiveDate: today, streak: newStreak };
        });
      },

      updateChallengeProgress: (challengeId, amount = 1) => {
          set((state) => {
              const updatedChallenges = state.dailyChallenges.map(c => {
                  if (c.id === challengeId && !c.completed) {
                      const newProgress = c.progress + amount;
                      if (newProgress >= c.target) {
                          get().addXP(c.xpReward, `Challenge Completed: ${c.text}`);
                          get().addNotification({ type: 'challenge', message: `Task Completed: ${c.text}` });
                          return { ...c, progress: c.target, completed: true };
                      }
                      return { ...c, progress: newProgress };
                  }
                  return c;
              });
              return { dailyChallenges: updatedChallenges };
          });
      },
      
      resetDailyChallenges: () => {
          const today = new Date().toISOString().split('T')[0];
          set((state) => {
              if (state.lastChallengesReset === today) return state;
              return {
                  lastChallengesReset: today,
                  dailyChallenges: [
                      { id: 1, text: 'Answer 5 questions', progress: 0, target: 5, completed: false, xpReward: 50 },
                      { id: 2, text: 'Complete a round/mock', progress: 0, target: 1, completed: false, xpReward: 100 },
                      { id: 3, text: 'Practice a company-specific round', progress: 0, target: 1, completed: false, xpReward: 50 }
                  ]
              };
          });
      }
    }),
    {
      name: 'interview-gamification-storage',
    }
  )
);
