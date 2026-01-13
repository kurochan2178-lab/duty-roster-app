import React, { useState } from 'react';
import { Users, Calendar, Table, LayoutDashboard, Menu } from 'lucide-react';
import { clsx } from 'clsx';

type View = 'dashboard' | 'staff' | 'calendar' | 'result';

interface LayoutProps {
    currentView: View;
    onViewChange: (view: View) => void;
    children: React.ReactNode;
}

export function Layout({ currentView, onViewChange, children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
        { id: 'staff', label: '職員管理', icon: Users },
        { id: 'calendar', label: 'カレンダー設定', icon: Calendar },
        { id: 'result', label: 'シフト作成', icon: Table },
    ] as const;

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
                    isSidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h1 className={clsx("font-bold text-xl text-indigo-600 truncate", !isSidebarOpen && "hidden")}>
                        当直表Maker
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                title={!isSidebarOpen ? item.label : undefined}
                            >
                                <Icon size={20} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    {isSidebarOpen && <div className="text-xs text-center text-gray-400">v0.1.0</div>}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
