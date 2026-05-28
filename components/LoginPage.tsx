import React, { useState } from 'react';
import { WaybillUser } from '../types';
import { Backend } from '../services/backend';

interface Props {
  onLogin: (user: WaybillUser) => void;
}

const ROLE_LABELS: Record<string, string> = {
  driver: 'Водій',
  dispatcher: 'Диспетчер',
  mechanic: 'Механік',
  logist: 'Логіст',
  admin: 'Адміністратор',
  medic: 'Медик',
};

export default function LoginPage({ onLogin }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = Backend.users.findByLogin(login.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError('Невірний логін або пароль');
      }
      setLoading(false);
    }, 400);
  };

  const quickLogin = (u: WaybillUser) => {
    setLogin(u.login);
    setPassword(u.password);
  };

  const allUsers = Backend.users.getAll();
  const demoUsers = [
    allUsers.find(u => u.role === 'driver' && !u.isApprentice)!,
    allUsers.find(u => u.role === 'driver' && u.isApprentice)!,
    allUsers.find(u => u.role === 'medic')!,
    allUsers.find(u => u.role === 'logist')!,
    allUsers.find(u => u.role === 'dispatcher')!,
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #002844 0%, #003A5D 50%, #004F7C 100%)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-2xl font-black" style={{ color: '#003A5D' }}>МХП</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">МХП Логістика</h1>
          <p className="text-white/60 text-sm mt-1">Електронний шляховий лист</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-gray-800 text-xl font-semibold mb-6">Вхід у систему</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Логін</label>
              <input
                type="text"
                value={login}
                onChange={e => { setLogin(e.target.value); setError(''); }}
                placeholder="Введіть логін"
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 text-gray-800 bg-surface"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Введіть пароль"
                className="w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#003A5D]/20 text-gray-800 bg-surface"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#FAF0EF', color: '#BC6261', border: '1px solid #D47E7D' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !login || !password}
              className="w-full py-3 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: loading || !login || !password ? undefined : '#003A5D' }}
            >
              {loading ? 'Вхід…' : 'Увійти'}
            </button>
          </form>

          {/* Demo quick-login */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Демо — швидкий вхід</p>
            <div className="space-y-1.5">
              {demoUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-primary-light text-left group transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-700">{u.fullName.split(' ')[0]} {u.fullName.split(' ')[1]}</span>
                    <span className="ml-2 text-xs text-gray-400">{ROLE_LABELS[u.role]}{u.isApprentice ? ' (стажер)' : ''}</span>
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-primary transition-colors font-mono">{u.login}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          МХП-Сервіс © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
