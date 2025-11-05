import React from 'react';
import { LogOut } from 'lucide-react';

const ResearcherSidebar = ({
  logoSrc,
  userProfile,
  sidebarItems,
  activeTab,
  onSelectTab,
  onLogout,
}) => (
  <aside className="w-64 bg-white shadow-lg fixed left-0 top-0 h-screen overflow-y-auto flex flex-col">
    <div className="p-6 border-b flex-shrink-0">
      <div className="flex items-center mb-4">
        <img src={logoSrc} alt="CuraLink" className="h-16" />
      </div>
      <div className="bg-primary-50 rounded-lg p-3">
        <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
        <p className="text-xs text-gray-600">
          {userProfile?.institution || 'Not specified'}
        </p>
      </div>
    </div>

    <nav className="p-4 space-y-1 flex-1">
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectTab(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
            activeTab === item.id
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {item.icon}
          <span className="font-medium text-sm">{item.label}</span>
        </button>
      ))}
    </nav>

    <div className="p-4 border-t flex-shrink-0">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium text-sm">Logout</span>
      </button>
    </div>
  </aside>
);

export default ResearcherSidebar;
