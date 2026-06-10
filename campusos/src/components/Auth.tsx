import React, { useState } from 'react';
import { Shield, Mail, Lock, User as UserIcon, BookOpen, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (!isLogin && !name)) {
      setError('Harap isi semua kolom.');
      setLoading(false);
      return;
    }

    // Simulate database lookup or save
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        if (isLogin) {
          const foundUser = users.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (foundUser) {
            const userSession: User = {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
            };
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            onLogin(userSession);
          } else {
            // Default demo account
            if (email === 'admin@campus.edu' && password === 'admin123') {
              const demoUser: User = {
                id: 'usr-demo',
                name: 'Mahasiswa Demo',
                email: 'admin@campus.edu',
              };
              localStorage.setItem('currentUser', JSON.stringify(demoUser));
              onLogin(demoUser);
            } else {
              setError('Email atau password salah. Coba: admin@campus.edu / admin123');
            }
          }
        } else {
          // Register user
          const emailExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase()) || email === 'admin@campus.edu';
          if (emailExists) {
            setError('Email sudah digunakan.');
            setLoading(false);
            return;
          }

          const newUser = {
            id: 'usr-' + Math.random().toString(36).substr(2, 9),
            name,
            email,
            password,
          };

          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));

          const userSession: User = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          };
          localStorage.setItem('currentUser', JSON.stringify(userSession));
          onLogin(userSession);
        }
      } catch (err) {
        setError('Terjadi kesalahan pada web browser local storage.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 font-medium text-slate-700">
      {/* Subtle organic background layers */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-100/30 rounded-full filter blur-xl opacity-60"></div>
      <div className="absolute top-20 right-4 w-72 h-72 bg-sky-100/30 rounded-full filter blur-xl opacity-60 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200/80 z-10"
      >
        <div>
          {/* Brand Icon & Logo */}
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Activity size={20} className="stroke-[2]" id="brand-logo" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-900 font-sans select-none">
              CampusOS
            </span>
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold text-slate-900 tracking-tight">
            {isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
          </h2>
          <p className="mt-1.5 text-center text-xs text-slate-500">
            {isLogin ? 'Masuk ke OS Survival Kampus Anda' : 'Mulai kelola perkuliahan & finansial dengan rapi'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-semibold border border-rose-100"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs placeholder-slate-400 font-semibold"
                    placeholder="Contoh: Kamal Fikar"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs placeholder-slate-400 font-semibold"
                  placeholder="name@campus.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs placeholder-slate-400 font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5 disabled:opacity-75 focus:outline-none cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isLogin ? 'Masuk' : 'Daftar Akun'}</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            {isLogin ? 'Belum punya akun?' : 'Sudah terdaftar?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-1 text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
            >
              {isLogin ? 'Daftar Sekarang' : 'Masuk di Sini'}
            </button>
          </p>
        </div>

        {/* Demo Hints */}
        {isLogin && (
          <div className="mt-4 p-3 bg-blue-50/40 text-center rounded-lg border border-blue-100/30 text-xs text-blue-800 leading-relaxed font-semibold">
            <span className="font-bold">Info Demo:</span> Masuk dengan <code className="bg-white px-1 py-0.5 rounded border border-slate-200/60 font-mono">admin@campus.edu</code> kata sandi <code className="bg-white px-1 py-0.5 rounded border border-slate-200/60 font-mono">admin123</code> atau daftar baru.
          </div>
        )}
      </motion.div>
    </div>
  );
}
