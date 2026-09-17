/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Copy,
  Check,
  Calendar,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  FileSpreadsheet,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { LineEntry, ChecklistMap, ScorecardResult } from '../types';
import { calculateScorecardMetrics, formatDateLabel } from '../utils';

interface PerformanceScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate?: (date: string) => void;
  onNavigate?: (tab: string) => void;
  onUpdateBottleneckStatus?: (lineNo: string, newStatus: 'ok' | 'high' | 'critical', action?: string) => void;
}

type WeightPreset = 'standard' | 'productivity' | 'compliance' | 'bottleneck';

export const PerformanceScorecardModal: React.FC<PerformanceScorecardModalProps> = ({
  isOpen,
  onClose,
  lines,
  checklists,
  selectedDate,
  onSelectDate,
  onNavigate,
  onUpdateBottleneckStatus
}) => {
  const [activePreset, setActivePreset] = useState<WeightPreset>('standard');
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(selectedDate);

  // Sync date if parent changes
  React.useEffect(() => {
    setSelectedAuditDate(selectedDate);
  }, [selectedDate]);

  // Weight distributions
  const weights = useMemo(() => {
    switch (activePreset) {
      case 'productivity':
        return { efficiency: 0.5, checklist: 0.25, bottleneck: 0.25 };
      case 'compliance':
        return { efficiency: 0.3, checklist: 0.4, bottleneck: 0.3 };
      case 'bottleneck':
        return { efficiency: 0.3, checklist: 0.2, bottleneck: 0.5 };
      case 'standard':
      default:
        return { efficiency: 0.4, checklist: 0.3, bottleneck: 0.3 };
    }
  }, [activePreset]);

  // Calculate metrics
  const scorecard: ScorecardResult = useMemo(() => {
    return calculateScorecardMetrics(lines, checklists, selectedAuditDate, weights);
  }, [lines, checklists, selectedAuditDate, weights]);

  if (!isOpen) return null;

  // Circular gauge math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorecard.overallScore / 100) * circumference;

  const handleCopySummary = () => {
    const text = [
      `=============================================`,
      `IE OPERATIONAL EFFECTIVENESS SCORECARD`,
      `Date: ${selectedAuditDate}`,
      `Plant: Unit 01 & 02 Garment Lines`,
      `=============================================`,
      `OVERALL SCORE: ${scorecard.overallScore}% (${scorecard.grade} - ${scorecard.gradeLabel})`,
      ``,
      `CORE PILLAR PERFORMANCE:`,
      `1. Line Efficiency: ${scorecard.pillars.efficiency.scorePct}% (Weight: ${scorecard.pillars.efficiency.weightPct}%)`,
      `   - Average Achieved: ${scorecard.efficiencyPillar.averageAchievedEff}% vs Target: ${scorecard.efficiencyPillar.averageTargetEff}%`,
      `   - Lines On Target: ${scorecard.efficiencyPillar.linesOnTargetCount} / ${scorecard.efficiencyPillar.linesCount}`,
      ``,
      `2. IE Checklist Completion: ${scorecard.pillars.checklist.scorePct}% (Weight: ${scorecard.pillars.checklist.weightPct}%)`,
      `   - Completed: ${scorecard.checklistPillar.completedTasks} / ${scorecard.checklistPillar.totalTasks} Daily Tasks`,
      `   - Pending Sign-off: ${scorecard.checklistPillar.pendingTasks} tasks`,
      ``,
      `3. Bottleneck Resolution: ${scorecard.pillars.bottleneck.scorePct}% (Weight: ${scorecard.pillars.bottleneck.weightPct}%)`,
      `   - Stabilized / Ok: ${scorecard.bottleneckPillar.resolvedCount} / ${scorecard.bottleneckPillar.totalBottlenecks}`,
      `   - High / Critical Escalations: ${scorecard.bottleneckPillar.highRiskCount + scorecard.bottleneckPillar.criticalCount}`,
      `   - Average Cycle Time: ${scorecard.bottleneckPillar.averageCycleTime}s (Target: ${scorecard.bottleneckPillar.averageTargetCT}s)`,
      ``,
      `DIRECTIVE RECOMMENDATIONS:`,
      ...scorecard.recommendations.map((r, i) => `[${i + 1}] ${r}`),
      `=============================================`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div
      id="performance-scorecard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="performance-scorecard-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#fbfaf6] text-[#17343a] rounded-3xl border border-[#d9d2c2] shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold uppercase font-display text-[#17343a] tracking-tight">
                  IE Performance Scorecard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-numbers font-black bg-[#eef7f7] text-[#176f78] border border-[#176f78]/20">
                  v2.4 AUDIT
                </span>
              </div>
              <p className="text-xs text-[#527078]">
                Overall IE effectiveness score calculated across Efficiency, Checklists &amp; Bottleneck Resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audit Date Picker Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a]">
              <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
              <input
                type="date"
                value={selectedAuditDate}
                onChange={e => {
                  setSelectedAuditDate(e.target.value);
                  if (onSelectDate) onSelectDate(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-bold text-[#17343a] focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#527078] hover:text-[#17343a] flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Main Hero Banner: Circular Score Dial + Grade + Presets */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#d9d2c2] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Circular Gauge Meter */}
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-[#f1eee6]"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke={scorecard.gradeColor}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono-numbers text-3xl font-black text-[#17343a] leading-none">
                    {scorecard.overallScore}%
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-[#738287] mt-1">
                    IE Score
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black font-mono-numbers text-white shadow-xs"
                    style={{ backgroundColor: scorecard.gradeColor }}
                  >
                    GRADE {scorecard.grade}
                  </span>
                  <span className="text-xs font-bold text-[#17343a]">
                    {scorecard.gradeLabel}
                  </span>
                </div>

                <p className="text-[11px] text-[#527078] max-w-sm leading-relaxed">
                  Composite performance index combining line output pace, standard floor checklist audits, and active bottleneck takt-time damping.
                </p>

                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono-numbers text-[#527078]">
                  <span>Audit Date: <strong>{formatDateLabel(selectedAuditDate)}</strong></span>
                  <span>•</span>
                  <span>Active Lines: <strong>{lines.length} Lines</strong></span>
                </div>
              </div>
            </div>

            {/* Weight Preset Selector Buttons */}
            <div className="w-full md:w-auto bg-[#fbfaf6] p-3 rounded-2xl border border-[#e7e1d5] space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase text-[#738287]">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#176f78]" />
                  Weighting Profile
                </span>
                <span className="text-[#176f78] font-mono-numbers">
                  {Math.round(weights.efficiency * 100)} / {Math.round(weights.checklist * 100)} / {Math.round(weights.bottleneck * 100)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivePreset('standard')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activePreset === 'standard'
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                  }`}
                >
                  Standard (40/30/30)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreset('productivity')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activePreset === 'productivity'
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                  }`}
                >
                  Output Focus (50/25/25)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreset('compliance')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activePreset === 'compliance'
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                  }`}
                >
                  Compliance (30/40/30)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreset('bottleneck')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activePreset === 'bottleneck'
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                  }`}
                >
                  Bottleneck Crisis (30/20/50)
                </button>
              </div>
            </div>
          </div>

          {/* 3 Core Pillar Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Line Efficiency Pillar */}
            <div className="rounded-2xl bg-white border border-[#d9d2c2] p-4 space-y-3 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-[#176f78] border border-teal-200">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#17343a]">
                        Line Efficiency
                      </h4>
                      <span className="text-[10px] text-[#738287]">
                        Weight: {scorecard.pillars.efficiency.weightPct}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black font-mono-numbers text-[#176f78]">
                      {scorecard.pillars.efficiency.scorePct}%
                    </span>
                    <span className="block text-[9px] text-[#738287] font-mono-numbers">
                      +{scorecard.pillars.efficiency.weightedScore} pts
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[#f1eee6] overflow-hidden">
                  <div
                    className="h-full bg-[#176f78] rounded-full transition-all"
                    style={{ width: `${Math.min(scorecard.pillars.efficiency.scorePct, 100)}%` }}
                  />
                </div>

                <div className="p-2 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Achieved Avg:</span>
                    <strong className="font-mono-numbers text-[#17343a]">
                      {scorecard.efficiencyPillar.averageAchievedEff}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Target Avg:</span>
                    <strong className="font-mono-numbers text-[#17343a]">
                      {scorecard.efficiencyPillar.averageTargetEff}%
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Lines On Target:</span>
                    <span className="font-bold text-emerald-700 font-mono-numbers">
                      {scorecard.efficiencyPillar.linesOnTargetCount} / {scorecard.efficiencyPillar.linesCount}
                    </span>
                  </div>
                </div>

                {/* Line Status Badges */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-bold text-[#738287] block">
                    Per-Line Status
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {lines.map(line => {
                      const isLow = line.targetEff - line.efficiency > 10;
                      const isTargetMet = line.efficiency >= line.targetEff;
                      return (
                        <span
                          key={line.id}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-numbers font-bold border ${
                            isTargetMet
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isLow
                              ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title={`L${line.lineNo}: ${line.efficiency}% (Target: ${line.targetEff}%)`}
                        >
                          L{line.lineNo}: {line.efficiency}%
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('line_data');
                  }}
                  className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#176f78] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Line Operations</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. IE Checklist Completion Pillar */}
            <div className="rounded-2xl bg-white border border-[#d9d2c2] p-4 space-y-3 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#17343a]">
                        Checklist Completion
                      </h4>
                      <span className="text-[10px] text-[#738287]">
                        Weight: {scorecard.pillars.checklist.weightPct}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black font-mono-numbers text-emerald-700">
                      {scorecard.pillars.checklist.scorePct}%
                    </span>
                    <span className="block text-[9px] text-[#738287] font-mono-numbers">
                      +{scorecard.pillars.checklist.weightedScore} pts
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[#f1eee6] overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.min(scorecard.pillars.checklist.scorePct, 100)}%` }}
                  />
                </div>

                <div className="p-2 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Completed Tasks:</span>
                    <strong className="font-mono-numbers text-emerald-700">
                      {scorecard.checklistPillar.completedTasks} / {scorecard.checklistPillar.totalTasks}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Pending Sign-Off:</span>
                    <span className="font-bold text-amber-700 font-mono-numbers">
                      {scorecard.checklistPillar.pendingTasks} tasks
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Flagged Incomplete:</span>
                    <span className="font-bold text-rose-700 font-mono-numbers">
                      {scorecard.checklistPillar.notDoneTasks} tasks
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#f0fdf4] border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                  <strong>Daily 12 Tasks Protocol:</strong> Audits morning line balancing, pitch time, 5S, TR sample verification, and shift-end recap.
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('checklist');
                  }}
                  className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Complete Daily Tasks</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3. Timely Bottleneck Resolution Pillar */}
            <div className="rounded-2xl bg-white border border-[#d9d2c2] p-4 space-y-3 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#17343a]">
                        Bottleneck Resolution
                      </h4>
                      <span className="text-[10px] text-[#738287]">
                        Weight: {scorecard.pillars.bottleneck.weightPct}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black font-mono-numbers text-amber-700">
                      {scorecard.pillars.bottleneck.scorePct}%
                    </span>
                    <span className="block text-[9px] text-[#738287] font-mono-numbers">
                      +{scorecard.pillars.bottleneck.weightedScore} pts
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[#f1eee6] overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all"
                    style={{ width: `${Math.min(scorecard.pillars.bottleneck.scorePct, 100)}%` }}
                  />
                </div>

                <div className="p-2 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Stabilized / Ok:</span>
                    <strong className="font-mono-numbers text-emerald-700">
                      {scorecard.bottleneckPillar.resolvedCount} / {scorecard.bottleneckPillar.totalBottlenecks}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">High / Critical Risk:</span>
                    <span className="font-bold text-rose-700 font-mono-numbers">
                      {scorecard.bottleneckPillar.highRiskCount + scorecard.bottleneckPillar.criticalCount} stations
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#527078]">Avg Cycle Time:</span>
                    <span className="font-bold text-[#17343a] font-mono-numbers">
                      {scorecard.bottleneckPillar.averageCycleTime}s (Target: {scorecard.bottleneckPillar.averageTargetCT}s)
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#fefce8] border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Mitigation Adherence:</strong> {scorecard.bottleneckPillar.mitigationAdherencePct}% of floor bottlenecks have recorded IE engineering fixes.
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('toolkit');
                  }}
                  className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-amber-800 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Lean Kaizen Tools</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Plant Floor Bottleneck Station Telemetry Table */}
          <div className="rounded-2xl bg-white border border-[#d9d2c2] overflow-hidden shadow-xs">
            <div className="p-3.5 bg-[#f1eee6] border-b border-[#d9d2c2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h3 className="font-display font-bold uppercase text-xs text-[#17343a]">
                  Active Line Bottleneck Stations &amp; Takt Time Resolution
                </h3>
              </div>
              <span className="text-[11px] font-mono-numbers text-[#527078]">
                {lines.length} Line Audits Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#fbfaf6] border-b border-[#e7e1d5] text-[10px] font-bold uppercase text-[#527078]">
                  <tr>
                    <th className="p-2.5">Line</th>
                    <th className="p-2.5">Style / Buyer</th>
                    <th className="p-2.5">Bottleneck Station</th>
                    <th className="p-2.5 text-center">Cycle Time</th>
                    <th className="p-2.5 text-center">Target CT</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5">Engineering Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {lines.map(line => {
                    const b = line.bottleneck;
                    const isOver = b && b.cycleTime > b.targetCT;
                    return (
                      <tr key={line.id} className="hover:bg-[#fbfaf6] transition-colors">
                        <td className="p-2.5 font-bold font-mono-numbers text-[#176f78]">
                          Line {line.lineNo}
                        </td>
                        <td className="p-2.5">
                          <span className="font-medium text-[#17343a] block">{line.style}</span>
                          <span className="text-[10px] text-[#738287]">{line.buyer}</span>
                        </td>
                        <td className="p-2.5 font-medium text-[#17343a]">
                          {b?.station || 'General sewing balance'}
                        </td>
                        <td className="p-2.5 text-center font-mono-numbers font-bold">
                          <span className={isOver ? 'text-rose-700' : 'text-emerald-700'}>
                            {b?.cycleTime || 45.0}s
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono-numbers text-[#527078]">
                          {b?.targetCT || 45.0}s
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block border ${
                              b?.status === 'ok'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : b?.status === 'high'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                            }`}
                          >
                            {b?.status || 'ok'}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-[#527078]">
                          {b?.action || 'Standard balance maintained'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable IE Directives & Recommendations */}
          <div className="rounded-2xl bg-[#eef7f7] border border-[#176f78]/25 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[#176f78]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <h4 className="font-display font-bold uppercase text-xs tracking-wider">
                Industrial Engineering Floor Directives &amp; Action Plan
              </h4>
            </div>

            <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-[#17343a] leading-relaxed">
              {scorecard.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-[#e7e1d5] bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#527078]" />
                  <span>Copy Management Summary</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-[#738287] hidden md:inline">
              Includes full score formulas &amp; floor directives
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Close Scorecard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
