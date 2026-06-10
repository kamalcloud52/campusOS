import React, { useState } from 'react';
import { Course } from '../types';
import { Award, BookOpen, Star, HelpCircle, Check, Play, RefreshCw, Calculator, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface GpaCalculatorProps {
  courses: Course[];
  onUpdateCourseGrade: (id: string, grade: Course['grade']) => void;
}

export default function GpaCalculator({ courses, onUpdateCourseGrade }: GpaCalculatorProps) {
  const [targetGpa, setTargetGpa] = useState<number>(3.5);
  const [simulationResults, setSimulationResults] = useState<{
    achievable: boolean;
    avgGradeNeeded: string;
    pointsNeeded: number;
    message: string;
  } | null>(null);

  // Constants
  const gradePoints: Record<string, number> = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0 };

  // Core Math computations
  const getOverallStats = () => {
    let totalSksEarned = 0;
    let totalSksWithGrades = 0;
    let totalSksTotal = 0;
    let totalGradeProducts = 0;

    courses.forEach((c) => {
      totalSksTotal += c.sks;
      if (c.grade !== '') {
        const points = gradePoints[c.grade] ?? 0;
        totalGradeProducts += points * c.sks;
        totalSksWithGrades += c.sks;
        if (c.grade !== 'E') {
          totalSksEarned += c.sks;
        }
      }
    });

    const gpa = totalSksWithGrades > 0 ? (totalGradeProducts / totalSksWithGrades) : 0.0;

    return {
      gpa: parseFloat(gpa.toFixed(2)),
      totalSksTotal,
      totalSksWithGrades,
      totalSksEarned,
      totalGradeProducts,
    };
  };

  const stats = getOverallStats();

  // Semester breakdown calculation
  const getSemestersStats = () => {
    const semestersMap: Record<number, { sks: number, products: number }> = {};
    courses.forEach((c) => {
      if (!semestersMap[c.semester]) {
        semestersMap[c.semester] = { sks: 0, products: 0 };
      }
      if (c.grade !== '') {
        semestersMap[c.semester].sks += c.sks;
        semestersMap[c.semester].products += (gradePoints[c.grade] ?? 0) * c.sks;
      }
    });

    return Object.entries(semestersMap).map(([sem, val]) => {
      const gpaIdx = val.sks > 0 ? (val.products / val.sks) : 0;
      return {
        semester: Number(sem),
        sks: val.sks,
        gpa: parseFloat(gpaIdx.toFixed(2)),
      };
    }).sort((a, b) => a.semester - b.semester);
  };

  const semesterBreakdowns = getSemestersStats();

  // Run GPA Target simulation
  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();

    const ongoingCourses = courses.filter((c) => c.grade === '');
    const gradedCourses = courses.filter((c) => c.grade !== '');

    if (ongoingCourses.length === 0) {
      setSimulationResults({
        achievable: false,
        avgGradeNeeded: '-',
        pointsNeeded: 0,
        message: 'Anda tidak memiliki mata kuliah yang sedang berlangsung (Ongoing) saat ini untuk disimulasikan.',
      });
      return;
    }

    const totalGradedProducts = gradedCourses.reduce((sum, c) => sum + (gradePoints[c.grade] ?? 0) * c.sks, 0);
    const totalGradedSks = gradedCourses.reduce((sum, c) => sum + c.sks, 0);
    const totalOngoingSks = ongoingCourses.reduce((sum, c) => sum + c.sks, 0);
    const totalAllSks = totalGradedSks + totalOngoingSks;

    // targetGpa = (totalGradedProducts + ongoingProductsNeeded) / totalAllSks
    const totalProductsNeeded = targetGpa * totalAllSks;
    const ongoingProductsNeeded = totalProductsNeeded - totalGradedProducts;

    if (ongoingProductsNeeded <= 0) {
      setSimulationResults({
        achievable: true,
        avgGradeNeeded: 'Lulus Saja (D/E)',
        pointsNeeded: 0,
        message: `Kabar baik! Nilai Anda sekarang sudah cukup tinggi. Bahkan jika Anda mendapat nilai D atau E di semua mata kuliah berlangsung, target IPK Anda sebesar ${targetGpa.toFixed(2)} tetap akan tercapai.`,
      });
      return;
    }

    const avgPointNeeded = ongoingProductsNeeded / totalOngoingSks;

    if (avgPointNeeded > 4.0) {
      setSimulationResults({
        achievable: false,
        avgGradeNeeded: 'Mutlak A+ (Mustahil)',
        pointsNeeded: ongoingProductsNeeded,
        message: `Secara matematis, target IPK sebesar ${targetGpa.toFixed(2)} TIDAK BISA DICAPAI semester ini, bahkan jika Anda mendapat nilai sempurna (A) di semua mata kuliah berlangsung (Poin rata-rata yang dibutuhkan: ${avgPointNeeded.toFixed(2)}).`,
      });
    } else {
      let gradeSuggestion = 'A';
      if (avgPointNeeded <= 1.0) gradeSuggestion = 'D';
      else if (avgPointNeeded <= 2.0) gradeSuggestion = 'C';
      else if (avgPointNeeded <= 3.0) gradeSuggestion = 'B';
      else gradeSuggestion = 'A';

      setSimulationResults({
        achievable: true,
        avgGradeNeeded: `${gradeSuggestion} (Rata-rata poin: ${avgPointNeeded.toFixed(2)})`,
        pointsNeeded: parseFloat(ongoingProductsNeeded.toFixed(1)),
        message: `Target IPK Anda dapat dicapai! Anda membutuhkan rata-rata nilai minimal berbobot "${gradeSuggestion}" atau setara dengan skor ${avgPointNeeded.toFixed(2)} pada total ${totalOngoingSks} SKS yang sedang berlangsung saat ini.`,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-medium text-slate-700">
      {/* Left Columns - Live Calculators and Distribution */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cumulative GPA Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] select-none">
            <Award size={100} />
          </div>

          <span className="text-[10px] bg-violet-50 text-violet-605 px-2.5 py-1 rounded border border-violet-100 select-none font-bold">
            Kalkulator IPK Otomatis
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold text-slate-900 leading-none">{stats.gpa.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">/ 4.00 IPK KONTROL</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Dihitung dari <strong className="text-slate-700">{stats.totalSksWithGrades} SKS</strong> yang telah memiliki nilai dari total <strong className="text-slate-705">{stats.totalSksTotal} SKS</strong> terdaftar.
              </p>
            </div>

            {/* GPA Progress Circle helper */}
            <div className="flex items-baseline gap-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100 shrink-0">
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">SKS Terselesaikan</span>
                <span className="text-base font-bold text-slate-800">{stats.totalSksEarned} SKS Lulus</span>
                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">SKS Belum Dinilai: {stats.totalSksTotal - stats.totalSksWithGrades} SKS</span>
              </div>
            </div>
          </div>

          {/* SKS Grade Setter List */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-3">Sesuaikan Nilai Mata Kuliah</h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {courses.map((course) => (
                <div key={course.id} className="p-2.5 bg-slate-50/50 border border-slate-100/60 rounded-lg flex items-center justify-between gap-3 text-xs font-medium">
                  <div className="min-w-0">
                    <span className="font-mono text-[9px] bg-white border border-slate-205 px-1.5 py-0.5 rounded text-slate-400 mr-2 shrink-0">{course.code}</span>
                    <span className="font-semibold text-slate-800 truncate">{course.name}</span>
                    <span className="text-slate-450 ml-1.5">({course.sks} SKS)</span>
                  </div>
                  <select
                    value={course.grade}
                    onChange={(e: any) => onUpdateCourseGrade(course.id, e.target.value)}
                    className="bg-white border border-slate-250 hover:border-slate-350 rounded-lg py-1 px-2.5 font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">Ongoing</option>
                    <option value="A">A (4.0)</option>
                    <option value="B">B (3.0)</option>
                    <option value="C">C (2.0)</option>
                    <option value="D">D (1.0)</option>
                    <option value="E">E (0.0)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Semester-wise breakdown history */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight mb-4 flex items-center gap-1.5">
            <Calculator size={16} className="text-slate-400" /> Ringkasan Indeks per Semester
          </h3>

          {semesterBreakdowns.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-medium">Belum ada rincian data perkuliahan terdaftar.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {semesterBreakdowns.map((sem) => (
                <div key={sem.semester} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Semester {sem.semester}</span>
                  <span className="block text-xl font-bold text-slate-800">{sem.gpa.toFixed(2)}</span>
                  <span className="block text-[9px] text-slate-400 font-semibold">{sem.sks} SKS Dinilai</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Simulator Input form and Results display */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calculator size={15} />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Simulator Target Kelulusan Kelompok</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Berapa nilai rata-rata yang harus diraih dari mata kuliah kuliah berlangsung untuk menyentuh target IPK Anda? Simulasikan di bawah ini:
          </p>

          <form onSubmit={handleSimulate} className="space-y-4 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                Nominal Target IPK (Kumulatif)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={targetGpa}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTargetGpa(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="3.50"
                  step="0.01"
                  min="0.00"
                  max="4.00"
                />
                <button
                  type="button"
                  onClick={() => setTargetGpa(3.50)}
                  className="px-2.5 py-1.5 text-slate-500 bg-slate-100/50 hover:bg-slate-100 border border-slate-200/40 rounded-lg text-xs font-semibold cursor-pointer transition focus:outline-none"
                  title="Reset ke 3.50"
                >
                  3.50
                </button>
                <button
                  type="button"
                  onClick={() => setTargetGpa(3.75)}
                  className="px-2.5 py-1.5 text-slate-500 bg-slate-100/50 hover:bg-slate-100 border border-slate-200/40 rounded-lg text-xs font-semibold cursor-pointer transition focus:outline-none"
                  title="Reset ke 3.75"
                >
                  3.75
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-none focus:outline-none cursor-pointer"
            >
              <Play size={13} className="fill-white" /> Mulai Hitung Simulasi
            </button>
          </form>

          {/* Results panel */}
          {simulationResults && (
            <motion.div
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                simulationResults.achievable
                  ? 'bg-emerald-50/55 text-emerald-800 border-emerald-250/50'
                  : 'bg-rose-50/50 text-rose-800 border-rose-250/50'
              } text-xs space-y-2`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {simulationResults.achievable ? (
                  <>
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>TARGET SANGAT BISA DICAPAI</span>
                  </>
                ) : (
                  <>
                    <HelpCircle size={16} className="text-rose-600 animate-pulse" />
                    <span>TARGET TIDAK MASUK AKAL</span>
                  </>
                )}
              </div>

              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 select-none">RATA-RATA NILAI TARGET MINIMAL</span>
                <span className="text-base font-bold tracking-tight block mt-0.5">{simulationResults.avgGradeNeeded}</span>
              </div>

              <p className="leading-relaxed text-[11px] font-medium mt-2 border-t border-slate-200/40 pt-2 text-slate-600">
                {simulationResults.message}
              </p>
            </motion.div>
          )}
        </div>

        {/* Grade Weighting Legend Card */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm space-y-2.5">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider select-none">Standar Konversi Bobot Nilai</h4>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px] font-bold">
            <div className="p-1.5 bg-slate-50/55 border border-slate-100/40 rounded">
              <span className="block text-slate-800 text-sm">A</span>
              <span className="text-slate-400 font-semibold mt-0.5 block">4.0</span>
            </div>
            <div className="p-1.5 bg-slate-50/55 border border-slate-100/40 rounded">
              <span className="block text-slate-800 text-sm">B</span>
              <span className="text-slate-400 font-semibold mt-0.5 block">3.0</span>
            </div>
            <div className="p-1.5 bg-slate-50/55 border border-slate-100/40 rounded">
              <span className="block text-slate-800 text-sm">C</span>
              <span className="text-slate-400 font-semibold mt-0.5 block">2.0</span>
            </div>
            <div className="p-1.5 bg-slate-50/55 border border-slate-100/40 rounded">
              <span className="block text-slate-800 text-sm">D</span>
              <span className="text-slate-400 font-semibold mt-0.5 block">1.0</span>
            </div>
            <div className="p-1.5 bg-slate-50/55 border border-slate-100/40 rounded">
              <span className="block text-slate-800 text-sm">E</span>
              <span className="text-slate-400 font-semibold mt-0.5 block">0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
