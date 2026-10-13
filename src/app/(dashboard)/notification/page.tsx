"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, Settings, CheckCheck } from "lucide-react";
import { NotificationList, Notification } from "@/components/notification/page";
import { peerLearningApi } from "@/lib/api/peerLearning";

export default function NotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const result = await peerLearningApi.getPeerNotifications("all");
    if (result.success && result.data) {
      setNotifications(result.data.notifications || []);
      setUnreadCount(result.data.unread_count || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    await peerLearningApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
    setUnreadCount(0);
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.status !== "unread") return;
    await peerLearningApi.markNotificationRead(notification._id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, status: "read" as const } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleStartSession = async (notification: Notification) => {
    // Mark as read then navigate to the session room
    if (notification.status === "unread") {
      await peerLearningApi.markNotificationRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, status: "read" as const } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    const isLearner = notification.role === "learner";
    router.push(
      `/peer-learning/pair-session?roomId=${notification.room_id}&peerId=${notification.matched_student_id}&peerName=${encodeURIComponent(notification.matched_student_name)}&topic=${encodeURIComponent(notification.topic)}&knowledgeGap=${encodeURIComponent(notification.topic)}&ai=0`
    );
  };

  return (
    <div className="h-screen w-full max-w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-500/30 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center bg-[#B45309] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </h1>
              <p className="text-xs text-subtle-foreground font-medium uppercase tracking-widest mt-1">Updates from your learning journey</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all as read</span>
              </button>
            )}
            <button className="p-2 text-subtle-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 pt-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted border border-border rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="animate-slide-up">
              <NotificationList
                notifications={notifications}
                onStartSession={handleStartSession}
                onMarkRead={handleMarkRead}
              />
            </div>
          )}
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
