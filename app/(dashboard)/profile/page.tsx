"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, CheckCircle, Shield } from "lucide-react";
import { updateProfileSchema, changePasswordSchema } from "@/types/schemas";
import type { UpdateProfileInput, ChangePasswordInput } from "@/types/schemas";
import { getInitials } from "@/lib/utils";

const roleBadgeColor: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  photographer: "bg-blue-100 text-blue-700 border-blue-200",
  member: "bg-green-100 text-green-700 border-green-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPwLoading, setIsPwLoading] = useState(false);

  const user = session?.user;
  const role = user?.role ?? "member";
  const isGoogleUser = !!(
    typeof window !== "undefined" &&
    session &&
    !session.user?.email?.includes("@") === false
  );

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user?.name) {
      resetProfile({ name: user.name });
    }
  }, [user?.name, resetProfile]);

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    setIsProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setProfileError(json.error ?? "Failed to update profile.");
        return;
      }

      await update({ name: data.name });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Something went wrong.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsPwLoading(true);
    setPwError(null);
    setPwSuccess(false);

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setPwError(json.error ?? "Failed to change password.");
        return;
      }

      setPwSuccess(true);
      resetPw();
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError("Something went wrong.");
    } finally {
      setIsPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your account information
        </p>
      </div>

      {/* Avatar & Info */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-yellow-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-2xl ring-4 ring-yellow-50">
                {getInitials(user?.name ?? "U")}
              </div>
            )}
            <button
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change avatar (coming soon)"
            >
              <Camera size={18} className="text-white" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-medium capitalize ${roleBadgeColor[role]}`}
              >
                <Shield size={10} />
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
        <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              className="input-field"
              {...regProfile("name")}
            />
            {profileErrors.name && (
              <p className="text-red-500 text-xs mt-1">{profileErrors.name.message}</p>
            )}
          </div>

          {profileError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{profileError}</p>
            </div>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-green-700 text-sm">Profile updated successfully!</p>
            </div>
          )}

          <button
            id="profile-save-btn"
            type="submit"
            disabled={isProfileLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {isProfileLoading && <Loader2 size={16} className="animate-spin" />}
            {isProfileLoading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password — only for credentials users */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Change Password</h3>
        <p className="text-gray-500 text-sm mb-4">
          {isGoogleUser
            ? "Password change is not available for Google accounts."
            : "Update your account password below."}
        </p>

        {!isGoogleUser && (
          <form onSubmit={handlePw(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                className="input-field"
                {...regPw("currentPassword")}
              />
              {pwErrors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {pwErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                className="input-field"
                {...regPw("newPassword")}
              />
              {pwErrors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {pwErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                className="input-field"
                {...regPw("confirmPassword")}
              />
              {pwErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {pwErrors.confirmPassword.message}
                </p>
              )}
            </div>

            {pwError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{pwError}</p>
              </div>
            )}

            {pwSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <CheckCircle size={16} className="text-green-500" />
                <p className="text-green-700 text-sm">Password changed successfully!</p>
              </div>
            )}

            <button
              id="change-password-btn"
              type="submit"
              disabled={isPwLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {isPwLoading && <Loader2 size={16} className="animate-spin" />}
              {isPwLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
