"use client";

import React from "react";
import { Bell, Users, Clock, ArrowRight, Award, GraduationCap } from "lucide-react";

export interface Notification {
  _id: string;
  student_id: string;
  type: "peer_match";
  matched_student_id: string;
  matched_student_name: string;
  room_id: string;
  topic: string;
  role: string;
  match_score: number;
  status: "unread" | "read";
  created_at: string;
  read_at?: string;
}

export interface NotificationItemProps {
  notification: Notification;
  onStartSession?: (notification: Notification) => void;
  onMarkRead?: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onStartSession, onMarkRead }) => {
  const isUnread = notification.status === "unread";
  const date = new Date(notification.created_at).toLocaleString();

  return (
    <div
      onClick={() => isUnread && onMarkRead?.(notification)}
      className={`group relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer
        ${
          isUnread
            ? "bg-teal-500/5 border-teal-500/20 "
            : "bg-muted border-border opacity-80"
        }
        hover:border-teal-500/40  
      `}
    >
      {isUnread && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#B45309] animate-pulse" />
      )}

      <div className="flex gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-colors
            ${
              notification.role === "learner"
                ? "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400 group-hover:bg-teal-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/20"
            }
          `}
        >
          {notification.role === "learner" ? <Users className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                {notification.role === "learner"
                  ? "You've been assigned as Peer Learner"
                  : "You've been assigned as Peer Teacher"}
              </h3>
              <p className="text-xs text-subtle-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {date}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400">
              {notification.topic}
            </span>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {notification.matched_student_name} has been matched with you for {notification.topic}.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-auto flex items-center gap-3 px-4 py-2 bg-muted border border-border rounded-xl">
              <span className="text-xs text-subtle-foreground uppercase tracking-widest font-semibold">Peer:</span>
              <span className="text-sm font-bold text-foreground">{notification.matched_student_name}</span>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3 px-4 py-2 bg-muted border border-border rounded-xl">
              <span className="text-xs text-subtle-foreground uppercase tracking-widest font-semibold">Role:</span>
              <span
                className={`text-sm font-bold capitalize ${
                  notification.role === "learner" ? "text-teal-700 dark:text-teal-400" : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {notification.role === "learner" ? "Peer Learner" : "Peer Teacher"}
              </span>
            </div>

            {notification.match_score > 0 && (
              <div className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl">
                <Award className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="text-sm font-semibold text-muted-foreground">
                  {Math.round(notification.match_score * 100)}% match
                </span>
              </div>
            )}

            {onStartSession && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartSession(notification);
                }}
                className="w-full sm:w-auto group/btn flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-[#0F172A] font-bold rounded-xl transition-all active:scale-95"
              >
                Start Session
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationList: React.FC<{
  notifications: Notification[];
  onStartSession?: (notification: Notification) => void;
  onMarkRead?: (notification: Notification) => void;
}> = ({ notifications, onStartSession, onMarkRead }) => {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center">
          <Bell className="w-10 h-10 text-subtle-foreground/70" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">No notifications yet</h3>
          <p className="text-subtle-foreground text-sm max-w-[280px]">
            We&apos;ll notify you when your peer learning sessions are ready or when there&apos;s an update.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif._id}
          notification={notif}
          onStartSession={onStartSession}
          onMarkRead={onMarkRead}
        />
      ))}
    </div>
  );
};
