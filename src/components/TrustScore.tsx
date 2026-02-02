"use client";

import { cn, getTrustColor, getTrustLabel } from "@/lib/utils";

interface TrustScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    verificationScore: number;
    activityConsistency: number;
    communityFeedback: number;
    codeAuditScore: number;
    transparencyScore: number;
  };
}

export function TrustScore({
  score,
  size = "md",
  showLabel = false,
  showBreakdown = false,
  breakdown,
}: TrustScoreProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-20 h-20 text-2xl",
    lg: "w-28 h-28 text-3xl",
  };

  const strokeWidth = size === "sm" ? 3 : size === "md" ? 4 : 5;
  const radius = size === "sm" ? 20 : size === "md" ? 34 : 48;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const colorClass = getTrustColor(score);
  const label = getTrustLabel(score);

  const breakdownItems = breakdown
    ? [
        { label: "Verification", value: breakdown.verificationScore, weight: "25%" },
        { label: "Activity", value: breakdown.activityConsistency, weight: "20%" },
        { label: "Community", value: breakdown.communityFeedback, weight: "20%" },
        { label: "Code Audit", value: breakdown.codeAuditScore, weight: "15%" },
        { label: "Transparency", value: breakdown.transparencyScore, weight: "20%" },
      ]
    : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", colorClass)}>{Math.round(score)}</span>
        </div>
      </div>

      {showLabel && (
        <span className={cn("text-sm font-medium", colorClass)}>{label}</span>
      )}

      {showBreakdown && breakdown && (
        <div className="w-full mt-4 space-y-3">
          {breakdownItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {Math.round(item.value)}{" "}
                  <span className="text-xs text-muted-foreground">({item.weight})</span>
                </span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrustBadge({ score }: { score: number }) {
  const colorClass = getTrustColor(score);
  const label = getTrustLabel(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        score >= 80 && "bg-green-500/20 text-green-400",
        score >= 60 && score < 80 && "bg-yellow-500/20 text-yellow-400",
        score >= 40 && score < 60 && "bg-orange-500/20 text-orange-400",
        score < 40 && "bg-red-500/20 text-red-400"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", colorClass.replace("text-", "bg-"))} />
      {Math.round(score)} - {label}
    </div>
  );
}
