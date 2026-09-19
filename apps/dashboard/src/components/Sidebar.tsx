import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/applications', label: 'Applications', icon: '⬚' },
  { to: '/journeys', label: 'Journeys', icon: '⟳' },
  { to: '/run', label: 'Run Journey', icon: '▷' },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✦</span>
          <div>
            <p className="font-bold text-white leading-none">FlowPilot</p>
            <p className="text-xs text-gray-400">Quality Engineering AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        <p>v0.1.0 — Demo Mode</p>
        <p>LLM: {(import.meta as { env?: Record<string, string> }).env?.['VITE_LLM_PROVIDER'] ?? 'mock'}</p>
      </div>
    </aside>
  );
}
