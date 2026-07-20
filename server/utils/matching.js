// Simple skill-similarity scoring — labeled "AI-powered matching" in UI.
// Weighted Jaccard-style overlap between required skills and freelancer skills,
// boosted by proficiency level and reputation.

const LEVEL_WEIGHT = { beginner: 0.5, intermediate: 0.75, expert: 1 };

function normalizeSkill(s) {
  return s.trim().toLowerCase();
}

function scoreFreelancer(requiredSkills, freelancer) {
  const required = requiredSkills.map(normalizeSkill);
  const freelancerSkills = freelancer.skills || [];

  let matchScore = 0;
  let matchedCount = 0;

  required.forEach((reqSkill) => {
    const match = freelancerSkills.find((s) => normalizeSkill(s.name) === reqSkill);
    if (match) {
      matchedCount += 1;
      matchScore += LEVEL_WEIGHT[match.level] || 0.5;
    }
  });

  if (matchedCount === 0) return 0;

  const skillSimilarity = matchScore / required.length;
  const reputationBoost = Math.min((freelancer.reputationScore || 0) / 5, 1) * 0.2;

  const finalScore = skillSimilarity * 0.8 + reputationBoost;
  return Math.round(finalScore * 100) / 100;
}

function rankFreelancers(requiredSkills, freelancers) {
  return freelancers
    .map((f) => ({ freelancer: f, score: scoreFreelancer(requiredSkills, f) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

module.exports = { scoreFreelancer, rankFreelancers };
