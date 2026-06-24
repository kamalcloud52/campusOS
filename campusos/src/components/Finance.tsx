import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Wallet, ArrowUpRight, ArrowDownRight, Search, Plus, Trash2, Calendar, FileText, Tag, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  openTransactionModalOnLoad: boolean;
  setOpenTransactionModalOnLoad: (open: boolean) => void;
}

export default function Finance({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  openTransactionModalOnLoad,
  setOpenTransactionModalOnLoad,
}: FinanceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal active
  const [addTxOpen, setAddTxOpen] = useState(openTransactionModalOnLoad);

  // New Tx fields
  const [txType, setTxType] = useState<TransactionType>('Expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Makanan & Minuman');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Categories helper
  const expenseCategories = [
    'Makanan & Minuman',
    'Kos / Sewa Kontrakan',
    'Peralatan Kuliah',
    'Internet / Pulsa',
    'Buku & Referensi',
    'Transportasi',
    'Hiburan / Refreshing',
    'Baju & Gaya Hidup',
    'Lain-lain',
  ];

  const incomeCategories = [
    'Saku Bulanan',
    'Proyek Sampingan',
    'Beasiswa',
    'Gaji Kerja Part-Time',
    'Hadiah / Lain-lain',
  ];

  // Helper formatting for Indonesian Rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !txDesc || !txCategory) return;

    onAddTransaction({
      type: txType,
      amount: parsedAmount,
      category: txCategory,
      description: txDesc,
      date: txDate,
    });

    // Reset fields
    setTxAmount('');
    setTxDesc('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setAddTxOpen(false);
    setOpenTransactionModalOnLoad(false);
  };

  // Calculate finance metrics
  const getFinancialSummaries = () => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === 'Income') income += t.amount;
      else expense += t.amount;
    });

    return {
      balance: income - expense,
      income,
      expense,
    };
  };

  const { balance, income, expense } = getFinancialSummaries();

  // Category statistics breakdown helper (For Expense only)
  const getCategoryStats = () => {
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === 'Expense') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    return Object.entries(categoryTotals).map(([name, amount]) => {
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        name,
        amount,
        percentage: parseFloat(percentage.toFixed(0)),
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5); // top 5
  };

  const expenseCategoryStats = getCategoryStats();

  const handleOpenAddTx = () => {
    setTxType('Expense');
    setTxCategory(expenseCategories[0]);
    setAddTxOpen(true);
  };

  // Filter transaction records
  const filteredTransactions = [...transactions].reverse().filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' ? true : t.type === typeFilter;
    const matchesCategory = categoryFilter === 'All' ? true : t.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Get dynamic category selection in filters based on filter type selection
  const allCategoriesLoaded = [...expenseCategories, ...incomeCategories];

  return (
    <div className="space-y-6">
      {/* Wallet overview card dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total balance wallet */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-950/20 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.04] p-6 select-none translate-x-4 translate-y-4">
            <Wallet size={120} />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SALDO DOMPET AKAD</span>
            <h2 className="text-2xl font-semibold tracking-tight truncate font-sans">
              {formatRupiah(balance)}
            </h2>
          </div>

          <button
            onClick={handleOpenAddTx}
            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 focus:outline-none relative z-10 cursor-pointer shadow-none"
          >
            <Plus size={14} /> Catat Transaksi Baru
          </button>
        </div>

        {/* Current Income statistics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL INFLOW (Pemasukan)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100/30 rounded-lg">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-emerald-600 truncate font-sans">
              {formatRupiah(income)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">Uang saku, beasiswa, dan proyek sampingan</p>
          </div>
        </div>

        {/* Current Expense statistics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL OUTFLOW (Pengeluaran)</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100/30 rounded-lg">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-slate-800 truncate font-sans">
              {formatRupiah(expense)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">Kos, makan, transportasi, dan kebutuhan belajar</p>
          </div>
        </div>
      </div>

      {/* Expense Categories Budget breakdown side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category analysis charts logs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4 font-medium text-slate-700">
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Distribusi Pengeluaran Kampus</h3>
          {expenseCategoryStats.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200/60 rounded-lg">
              <BarChart3 size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Belum ada rincian pengeluaran kuliah dicatat.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {expenseCategoryStats.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate">{item.name}</span>
                    <span className="font-bold flex-shrink-0 text-slate-800">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="block text-[10px] text-slate-400 text-right font-mono font-bold mt-0.5">
                    {formatRupiah(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ledger logs list display */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4 font-medium text-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Buku Kas (Buku Harian Finansial)</h3>

            {/* Quick selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value="All">Semua Aliran</option>
                <option value="Income">Uang Masuk</option>
                <option value="Expense">Uang Keluar</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg px-2.5 py-1 focus:outline-none max-w-[130px] truncate"
              >
                <option value="All">Semua Kategori</option>
                {allCategoriesLoaded.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-semibold placeholder-slate-450"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200/60 rounded-lg">
                <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs text-slate-400 font-semibold">Tidak ada transaksi yang cocok</p>
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50/40 hover:bg-slate-100/60 border border-slate-100/60 rounded-lg flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg text-white shrink-0 mt-0.5 ${
                      t.type === 'Income' ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}>
                      {t.type === 'Income' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-800 truncate leading-snug">{t.description}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="text-slate-500 font-bold">{t.category}</span>
                        <span>•</span>
                        <span>{t.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs font-semibold ${
                      t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {t.type === 'Income' ? '+' : '-'} {formatRupiah(t.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition hover:bg-rose-50 cursor-pointer"
                      title="Hapus Transaksi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction additions form Modal */}
      <AnimatePresence>
        {addTxOpen && (
          <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200/80 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-base">Catat Aliran Kas Baru</h3>
                <button 
                  onClick={() => { setAddTxOpen(false); setOpenTransactionModalOnLoad(false); }} 
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 focus:outline-none cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                {/* Income vs Expense Selection Tabs */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">Tipe Arus Kas</label>
                  <div className="flex bg-slate-50 border border-slate-200/40 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setTxType('Expense');
                        setTxCategory(expenseCategories[0]);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        txType === 'Expense' ? 'bg-white text-slate-900 shadow-xs border border-slate-250/20' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Nominal Uang Keluar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxType('Income');
                        setTxCategory(incomeCategories[0]);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                        txType === 'Income' ? 'bg-white text-emerald-600 shadow-xs border border-slate-250/20' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Nominal Uang Masuk
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Jumlah Bobot Transaksi (Rupiah)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs font-sans">
                      Rp
                    </div>
                    <input
                      type="text"
                      required
                      value={txAmount}
                      onChange={(e) => {
                        // Numeric filter
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setTxAmount(val === '' ? '' : Number(val).toLocaleString('id-ID'));
                      }}
                      placeholder="Contoh: 50.000"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Kategori Transaksi</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      {txType === 'Expense' ? (
                        expenseCategories.map((c) => (
                           <option key={c} value={c}>{c}</option>
                        ))
                      ) : (
                        incomeCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none font-sans">Tanggal Catat</label>
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Deskripsi Singkat</label>
                  <input
                    type="text"
                    required
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="Contoh: Beli fotokopi modul kuis basis data"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => { setAddTxOpen(false); setOpenTransactionModalOnLoad(false); }}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition focus:outline-none border border-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition focus:outline-none cursor-pointer"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
