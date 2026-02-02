import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeProject, quickAnalyzeGithub } from "@/lib/trust-algorithm";
import { z } from "zod";

const verifySchema = z.object({
  projectName: z.string().min(1).max(100),
  githubUrl: z.string().url().optional().nullable(),
  description: z.string().min(10).max(2000),
  category: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = verifySchema.parse(body);

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        projectName: data.projectName,
        githubUrl: data.githubUrl,
        description: data.description,
        category: data.category,
        email: data.email,
        status: "analyzing",
      },
    });

    // Analyze the project
    let analysis;

    if (data.githubUrl) {
      // Try to fetch GitHub repo data
      try {
        const repoPath = new URL(data.githubUrl).pathname.slice(1);
        const [owner, repo] = repoPath.split("/");

        if (owner && repo) {
          // Fetch basic repo info from GitHub API
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "AgentUber-Verification",
              },
            }
          );

          if (response.ok) {
            const repoData = await response.json();

            analysis = quickAnalyzeGithub({
              stars: repoData.stargazers_count || 0,
              forks: repoData.forks_count || 0,
              openIssues: repoData.open_issues_count || 0,
              hasReadme: true, // Assume true if repo exists
              hasLicense: !!repoData.license,
              lastCommit: new Date(repoData.pushed_at || Date.now()),
              commitsLastMonth: 10, // Default estimate
              contributors: 1, // Would need additional API call
            });
          }
        }
      } catch (error) {
        console.error("GitHub API error:", error);
      }
    }

    // Fallback to basic analysis if GitHub fetch failed
    if (!analysis) {
      analysis = analyzeProject({
        hasGithub: !!data.githubUrl,
        hasDescription: data.description.length > 50,
        hasDocumentation: data.description.length > 200,
        isOpenSource: !!data.githubUrl,
        hasTests: false,
        hasSecurityPolicy: false,
        hasLicense: false,
        commitActivity: data.githubUrl ? 50 : 20,
        communitySize: 0,
        responseRate: 50,
      });
    }

    // Update verification request with results
    const updated = await prisma.verificationRequest.update({
      where: { id: verificationRequest.id },
      data: {
        score: analysis.score,
        feedback: JSON.stringify({
          breakdown: analysis.breakdown,
          recommendations: analysis.recommendations,
        }),
        status: "completed",
      },
    });

    return NextResponse.json({
      id: updated.id,
      projectName: updated.projectName,
      score: analysis.score,
      breakdown: analysis.breakdown,
      recommendations: analysis.recommendations,
      status: "completed",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Verification ID required" },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    let feedback;
    try {
      feedback = verification.feedback ? JSON.parse(verification.feedback) : null;
    } catch {
      feedback = null;
    }

    return NextResponse.json({
      id: verification.id,
      projectName: verification.projectName,
      score: verification.score,
      breakdown: feedback?.breakdown,
      recommendations: feedback?.recommendations,
      status: verification.status,
      createdAt: verification.createdAt,
    });
  } catch (error) {
    console.error("GET /api/verify error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification" },
      { status: 500 }
    );
  }
}
