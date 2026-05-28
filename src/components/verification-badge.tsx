// @ts-nocheck
/**
 * Verification Badge Component
 * Displays user verification status and badges
 */

import React from "react";
import { Check, CheckCircle2, Shield, Award } from "lucide-react";
import type { UserBadge } from "@/lib/enhanced-types";

export interface VerificationBadgeProps {
  badges: UserBadge[];
  verificationStatus?: "verified" | "pending" | "unverified";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeConfig = {
  verified_student: {
    label: "Verified Student",
    icon: CheckCircle2,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    tooltip: "Institution-verified student",
  },
  verified_graduate: {
    label: "Verified Graduate",
    icon: Award,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    tooltip: "Institution-verified graduate",
  },
  verified_recruiter: {
    label: "Verified Recruiter",
    icon: Shield,
    color: "bg-green-100 text-green-700 border-green-300",
    tooltip: "Verified recruiting professional",
  },
  verified_institution: {
    label: "Verified Institution",
    icon: CheckCircle2,
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    tooltip: "Verified educational institution",
  },
};

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const badgeSizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-base",
};

export function VerificationBadge({
  badges,
  verificationStatus,
  size = "md",
  showLabel = true,
}: VerificationBadgeProps) {
  const activeBadges = badges?.filter((b) => !b.expires_at || new Date(b.expires_at) > new Date()) || [];

  if (activeBadges.length === 0 && verificationStatus !== "verified") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Primary verification status */}
      {verificationStatus === "verified" && (
        <div className={`flex items-center gap-1 rounded-full border ${badgeSizeClasses[size]} bg-green-50 border-green-300`}>
          <Check className={`${sizeClasses[size]} text-green-600`} />
          {showLabel && <span className="font-medium text-green-700">Verified</span>}
        </div>
      )}

      {/* Individual badges */}
      {activeBadges.map((badge) => {
        const config = badgeConfig[badge.badge_type as keyof typeof badgeConfig];
        if (!config) return null;

        const IconComponent = config.icon;

        return (
          <div
            key={badge.id}
            className={`flex items-center gap-1 rounded-full border ${badgeSizeClasses[size]} ${config.color}`}
            title={config.tooltip}
          >
            <IconComponent className={sizeClasses[size]} />
            {showLabel && <span className="font-medium">{config.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Inline verification indicator - compact version
 */
export function InlineVerificationBadge({ badges, size = "md" }: { badges: UserBadge[]; size?: "sm" | "md" }) {
  const hasBadges = badges && badges.some((b) => !b.expires_at || new Date(b.expires_at) > new Date());

  if (!hasBadges) {
    return null;
  }

  return (
    <div className="flex gap-1">
      {badges
        .filter((b) => !b.expires_at || new Date(b.expires_at) > new Date())
        .map((badge) => {
          const config = badgeConfig[badge.badge_type as keyof typeof badgeConfig];
          if (!config) return null;

          const IconComponent = config.icon;

          return (
            <div key={badge.id} title={config.tooltip}>
              <IconComponent className={`${sizeClasses[size]} text-blue-600`} />
            </div>
          );
        })}
    </div>
  );
}

/**
 * Verification status indicator
 */
export interface VerificationStatusProps {
  status: "verified" | "pending" | "unverified";
  size?: "sm" | "md";
}

export function VerificationStatus({ status, size = "md" }: VerificationStatusProps) {
  const config = {
    verified: {
      label: "Verified",
      color: "text-green-600 bg-green-50 border-green-200",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending",
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      icon: Shield,
    },
    unverified: {
      label: "Unverified",
      color: "text-gray-600 bg-gray-50 border-gray-200",
      icon: Shield,
    },
  };

  const current = config[status];
  const IconComponent = current.icon;

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${current.color}`}>
      <IconComponent className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      <span className={`font-medium ${size === "sm" ? "text-xs" : "text-sm"}`}>{current.label}</span>
    </div>
  );
}