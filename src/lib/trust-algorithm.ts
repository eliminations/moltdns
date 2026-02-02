export interface TrustBreakdown {
  verificationScore: number;    // Platform verification (25%)
  activityConsistency: number;  // Activity consistency (20%)
  communityFeedback: number;    // Community feedback (20%)
  codeAuditScore: number;       // Code audit status (15%)
  transparencyScore: number;    // Transparency metrics (20%)
}

export interface TrustAnalysis {
  score: number;
  breakdown: TrustBreakdown;
  recommendations: string[];
}

const WEIGHTS = {
  verification: 0.25,
  activity: 0.20,
  community: 0.20,
  audit: 0.15,
  transparency: 0.20,
};

export function calculateTrustScore(breakdown: TrustBreakdown): number {
  const score =
    breakdown.verificationScore * WEIGHTS.verification +
    breakdown.activityConsistency * WEIGHTS.activity +
    breakdown.communityFeedback * WEIGHTS.community +
    breakdown.codeAuditScore * WEIGHTS.audit +
    breakdown.transparencyScore * WEIGHTS.transparency;

  return Math.round(score * 10) / 10;
}

export function analyzeProject(data: {
  hasGithub: boolean;
  hasDescription: boolean;
  hasDocumentation: boolean;
  isOpenSource: boolean;
  hasTests: boolean;
  hasSecurityPolicy: boolean;
  hasLicense: boolean;
  commitActivity: number; // 0-100
  communitySize: number;
  responseRate: number; // 0-100
}): TrustAnalysis {
  const recommendations: string[] = [];

  // Verification Score (0-100)
  let verificationScore = 20; // Base score
  if (data.hasGithub) verificationScore += 30;
  if (data.isOpenSource) verificationScore += 25;
  if (data.hasLicense) verificationScore += 15;
  if (data.hasSecurityPolicy) verificationScore += 10;
  if (verificationScore < 50) {
    recommendations.push("Add your project to GitHub for verification");
    recommendations.push("Include an open-source license");
  }

  // Activity Consistency (0-100)
  let activityConsistency = data.commitActivity;
  if (activityConsistency < 50) {
    recommendations.push("Maintain regular commit activity");
  }

  // Community Feedback (0-100)
  let communityFeedback = 30; // Base
  communityFeedback += Math.min(data.communitySize / 10, 40);
  communityFeedback += data.responseRate * 0.3;
  if (communityFeedback < 50) {
    recommendations.push("Engage with your community");
    recommendations.push("Respond to issues and feedback promptly");
  }

  // Code Audit Score (0-100)
  let codeAuditScore = 20; // Base
  if (data.hasTests) codeAuditScore += 40;
  if (data.hasSecurityPolicy) codeAuditScore += 20;
  if (data.isOpenSource) codeAuditScore += 20;
  if (codeAuditScore < 50) {
    recommendations.push("Add automated tests");
    recommendations.push("Include a security policy (SECURITY.md)");
  }

  // Transparency Score (0-100)
  let transparencyScore = 20; // Base
  if (data.hasDescription) transparencyScore += 25;
  if (data.hasDocumentation) transparencyScore += 35;
  if (data.isOpenSource) transparencyScore += 20;
  if (transparencyScore < 50) {
    recommendations.push("Add comprehensive documentation");
    recommendations.push("Write a detailed project description");
  }

  const breakdown: TrustBreakdown = {
    verificationScore: Math.min(verificationScore, 100),
    activityConsistency: Math.min(activityConsistency, 100),
    communityFeedback: Math.min(communityFeedback, 100),
    codeAuditScore: Math.min(codeAuditScore, 100),
    transparencyScore: Math.min(transparencyScore, 100),
  };

  return {
    score: calculateTrustScore(breakdown),
    breakdown,
    recommendations: recommendations.slice(0, 5),
  };
}

export function quickAnalyzeGithub(repoData: {
  stars: number;
  forks: number;
  openIssues: number;
  hasReadme: boolean;
  hasLicense: boolean;
  lastCommit: Date;
  commitsLastMonth: number;
  contributors: number;
}): TrustAnalysis {
  const now = new Date();
  const daysSinceCommit = Math.floor(
    (now.getTime() - repoData.lastCommit.getTime()) / (1000 * 60 * 60 * 24)
  );

  return analyzeProject({
    hasGithub: true,
    hasDescription: repoData.hasReadme,
    hasDocumentation: repoData.hasReadme,
    isOpenSource: true,
    hasTests: repoData.commitsLastMonth > 5, // Proxy for active development
    hasSecurityPolicy: false, // Would need additional API call
    hasLicense: repoData.hasLicense,
    commitActivity: Math.max(0, 100 - daysSinceCommit * 2),
    communitySize: repoData.stars + repoData.forks * 2,
    responseRate: repoData.openIssues < 10 ? 80 : Math.max(20, 100 - repoData.openIssues),
  });
}
