"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, Send, AtSign, Loader2 } from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CommentUser {
  _id: string;
  name: string;
  image?: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: CommentUser;
  taggedUsers: CommentUser[];
  createdAt: string;
}

interface CommentSectionProps {
  mediaId: string;
  currentUserId?: string;
  currentUserRole?: string;
  initialComments?: Comment[];
}

interface UserSearchResult {
  _id: string;
  name: string;
  image?: string;
  email: string;
}

function Avatar({ user }: { user: CommentUser }) {
  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-semibold flex-shrink-0">
      {getInitials(user.name)}
    </div>
  );
}

function renderContent(content: string, taggedUsers: CommentUser[]) {
  // Replace @name mentions with yellow spans
  let result = content;
  const parts: React.ReactNode[] = [];
  const tagNames = taggedUsers.map((u) => u.name);
  
  // Split by @mentions
  const regex = /@(\w[\w\s]*?)(?=\s|$|[^a-zA-Z0-9\s])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const mentionName = match[1];
    const isTagged = tagNames.some((n) =>
      n.toLowerCase().includes(mentionName.toLowerCase())
    );
    parts.push(
      <span
        key={match.index}
        className={isTagged ? "text-yellow-700 font-medium" : ""}
      >
        @{mentionName}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [content];
}

export default function CommentSection({
  mediaId,
  currentUserId,
  currentUserRole,
  initialComments = [],
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [taggedUsers, setTaggedUsers] = useState<UserSearchResult[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  const MAX_CHARS = 500;

  // User mention search
  useEffect(() => {
    if (!userSearch || userSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearch)}`);
        const data = await res.json();
        setSearchResults(data.users ?? []);
        setShowMentionDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Close mention dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    // Detect @mention trigger
    const lastAtIdx = val.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const q = val.slice(lastAtIdx + 1);
      if (!q.includes(" ") && q.length >= 0) {
        setUserSearch(q);
      } else {
        setUserSearch("");
        setShowMentionDropdown(false);
      }
    } else {
      setUserSearch("");
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (user: UserSearchResult) => {
    const lastAtIdx = content.lastIndexOf("@");
    const newContent = content.slice(0, lastAtIdx) + `@${user.name} `;
    setContent(newContent);
    setTaggedUsers((prev) => {
      if (prev.find((u) => u._id === user._id)) return prev;
      return [...prev, user];
    });
    setShowMentionDropdown(false);
    setUserSearch("");
    textareaRef.current?.focus();
  };

  const handlePost = async () => {
    if (!content.trim() || content.length > MAX_CHARS || isPosting) return;

    setIsPosting(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          taggedUserIds: taggedUsers.map((u) => u._id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setContent("");
        setTaggedUsers([]);
      }
    } catch {}
    finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setIsDeleting(commentId);
    try {
      const res = await fetch(
        `/api/media/${mediaId}/comment?commentId=${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch {}
    finally {
      setIsDeleting(null);
    }
  };

  const canDelete = (comment: Comment) =>
    comment.userId._id === currentUserId || currentUserRole === "admin";

  return (
    <div className="space-y-4">
      {/* Comment list */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-2.5 group">
              <Avatar user={comment.userId} />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <span className="font-semibold text-gray-900 text-sm mr-1.5">
                    {comment.userId.name}
                  </span>
                  <span className="text-gray-700 text-sm break-words">
                    {renderContent(comment.content, comment.taggedUsers)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">
                  {formatRelativeTime(comment.createdAt)}
                </p>
              </div>
              {canDelete(comment) && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  disabled={isDeleting === comment._id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-1"
                  aria-label="Delete comment"
                >
                  {isDeleting === comment._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mention dropdown */}
      {showMentionDropdown && searchResults.length > 0 && (
        <div
          ref={mentionRef}
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {searchResults.map((user) => (
            <button
              key={user._id}
              onClick={() => selectMention(user)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-yellow-50 transition-colors text-left"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-bold">
                  {getInitials(user.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tagged users chips */}
      {taggedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {taggedUsers.map((u) => (
            <span
              key={u._id}
              className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full"
            >
              @{u.name}
              <button
                onClick={() => setTaggedUsers((prev) => prev.filter((x) => x._id !== u._id))}
                className="hover:text-red-500 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input area */}
      {currentUserId ? (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              id={`comment-input-${mediaId}`}
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !showMentionDropdown) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Add a comment… type @ to mention someone"
              rows={2}
              maxLength={MAX_CHARS}
              className="input-field resize-none text-sm pr-10"
            />
            <span
              className={cn(
                "absolute bottom-2 right-2 text-xs",
                content.length > MAX_CHARS * 0.9
                  ? "text-red-400"
                  : "text-gray-300"
              )}
            >
              {content.length}/{MAX_CHARS}
            </span>
          </div>
          <div className="flex justify-end">
            <button
              id={`post-comment-${mediaId}`}
              onClick={handlePost}
              disabled={!content.trim() || content.length > MAX_CHARS || isPosting}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {isPosting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {isPosting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-2">
          <a href="/login" className="text-yellow-600 hover:underline font-medium">
            Sign in
          </a>{" "}
          to comment
        </p>
      )}
    </div>
  );
}
