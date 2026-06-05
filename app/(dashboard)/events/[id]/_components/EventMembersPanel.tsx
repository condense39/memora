"use client";

import { useState } from "react";
import { UserPlus, ShieldAlert, Tag, Trash2, Loader2, MoreVertical } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface MemberProps {
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: "club_admin" | "club_member";
}

export default function EventMembersPanel({
  eventId,
  initialMembers,
}: {
  eventId: string;
  initialMembers: MemberProps[];
}) {
  const [members, setMembers] = useState<MemberProps[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"club_admin" | "club_member">("club_member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setMembers(data);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}/members/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      setMembers(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error removing member");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change role");
      setMembers(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error changing role");
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-gray-900">Members Management</h3>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
          {members.length}
        </span>
      </div>

      <form onSubmit={handleAddMember} className="space-y-3">
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <input
          type="email"
          placeholder="User email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field w-full text-sm py-1.5"
          required
        />
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="input-field text-sm py-1.5 flex-1"
          >
            <option value="club_member">Member</option>
            <option value="club_admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-1.5 px-3 flex items-center gap-1 text-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3 mt-4 max-h-64 overflow-y-auto pr-1">
        {members.map((m) => (
          <div key={m.userId._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group">
            {m.userId.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.userId.image} alt={m.userId.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-medium text-xs flex items-center justify-center">
                {getInitials(m.userId.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.userId.name}</p>
              <p className="text-xs text-gray-500 truncate">{m.userId.email}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.userId._id, e.target.value)}
                className={`text-xs px-2 py-1 rounded border-none font-medium outline-none ${
                  m.role === "club_admin" ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-700"
                }`}
              >
                <option value="club_admin">Admin</option>
                <option value="club_member">Member</option>
              </select>
              <button
                onClick={() => handleRemoveMember(m.userId._id)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
