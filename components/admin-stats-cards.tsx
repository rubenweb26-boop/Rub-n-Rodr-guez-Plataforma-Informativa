"use client";

import { FileText, Clock, AlertTriangle, CheckCircle2, Users, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, bgColor, trend }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-[#ded8ce] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#556377]">{title}</p>
          <p className="mt-2 text-3xl font-black text-[#142235]">{value.toLocaleString("es-CR")}</p>
          {trend && (
            <p className="mt-1 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp size={10} /> {trend}
            </p>
          )}
        </div>
        <div className={`flex size-12 items-center justify-center rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface AdminStatsCardsProps {
  stats: {
    totalComplaints: number;
    pendingComplaints: number;
    inReviewComplaints: number;
    closedComplaints: number;
    totalUsers: number;
  };
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      title: "Total Denuncias",
      value: stats.totalComplaints,
      icon: <FileText className="text-[#d84d3d]" size={24} />,
      color: "text-[#d84d3d]",
      bgColor: "bg-[#fffdf9]",
    },
    {
      title: "Pendientes de Revisión",
      value: stats.pendingComplaints,
      icon: <Clock className="text-[#f59e0b]" size={24} />,
      color: "text-[#f59e0b]",
      bgColor: "bg-[#fffbeb]",
    },
    {
      title: "En Revisión",
      value: stats.inReviewComplaints,
      icon: <AlertTriangle className="text-[#3b82f6]" size={24} />,
      color: "text-[#3b82f6]",
      bgColor: "bg-[#eff6ff]",
    },
    {
      title: "Cerradas / Resueltas",
      value: stats.closedComplaints,
      icon: <CheckCircle2 className="text-emerald-600" size={24} />,
      color: "text-emerald-600",
      bgColor: "bg-[#ecfdf5]",
    },
    {
      title: "Usuarios Activos",
      value: stats.totalUsers,
      icon: <Users className="text-[#8b5cf6]" size={24} />,
      color: "text-[#8b5cf6]",
      bgColor: "bg-[#f5f3ff]",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}