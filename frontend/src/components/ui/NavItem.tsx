"use client";

import { ReactNode } from "react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  sidebarOpen?: boolean;
}

export function NavItem({ icon, label, active = false, sidebarOpen = true }: NavItemProps) {
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
    `}>
      <div className={`shrink-0 ${active ? 'text-white' : 'group-hover:text-blue-600'}`}>{icon}</div>
      {sidebarOpen && <span className="text-sm">{label}</span>}
    </div>
  );
}
