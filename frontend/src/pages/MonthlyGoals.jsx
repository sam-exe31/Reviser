import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Zap,
  Layers,
  HelpCircle,
  Calendar,
  Check,
  RotateCcw,
  ListTodo,
  Compass,
  Lightbulb,
  X,
  Gauge,
  AlertTriangle,
  Flame,
  RefreshCw,
  TrendingUp,
  Activity,
  Coffee
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Modal, Button } from '../components/ui';

export const ROADMAP_CATEGORIES = [
  { id: 'DSA', label: 'DSA & Pattern Review', desc: '12 hrs/wk · 2 new/day + 4 re-solves (Two Pointers, DP, Trees, Graphs)' },
  { id: 'Core CS', label: 'Core CS (DBMS / OS / CN)', desc: '2.5 hrs/wk · 30 min/day low-energy slot (DBMS first, OS next, CN last)' },
  { id: 'Workers Den', label: 'Workers Den', desc: '8 hrs/wk · Redis caching, DB indexing, connection pooling' },
  { id: 'Spring Boot Drill', label: 'Spring Boot Drill', desc: '1.5 hrs/wk · 1 runtime execution context question/week' },
  { id: 'Applications / Referrals', label: 'Applications & Referrals', desc: '2.5 hrs/wk · 3-5 referrals/week, JSCOE alumni, tracker' },
  { id: 'Open Source', label: 'Open Source', desc: '5 hrs/wk · Sundays: JabRef PRs, LFX / GSoC positioning' }
];

const QUICK_PROMPTS = [
  {
    title: 'Sam Roadmap: Summer 2027 SDE Sprint',
    desc: '35.5 hrs/wk: DSA 12h, Core CS 2.5h, Workers Den 8h, Spring Drill 1.5h, Referrals 2.5h, Open Source 5h.'
  },
  {
    title: 'Weeks 1–4 Consolidation Phase',
    desc: 'Two pointers, sliding window, prefix sum, binary search on answer, monotonic stack, intervals with 4-line journal.'
  },
  {
    title: 'Weeks 5–8 DP & Trees Volume',
    desc: '1D/2D DP, knapsack, trees BFS/DFS, heaps + Saturday timed OA simulations (90 min, no AI).'
  },
  {
    title: 'Weeks 9–12 Graphs & Final Polish',
    desc: 'Graphs, topological sort, union-find, backtracking, tries, peer mock interviews, and final exam ramp-down.'
  }
];

// Module-level manager so analysis survives route changes / leaving the app
let inFlightAnalysisPromise = null;
let inFlightAnalysisParams = null;
const analysisSubscribers = new Set();

function notifySubscribers(event) {
  analysisSubscribers.forEach(fn => {
    try { fn(event); } catch (e) { console.error('Subscriber error:', e); }
  });
}

function startBackgroundAnalysis(prompt, answers = {}, month) {
  const trimmed = prompt ? prompt.trim() : '';
  if (!trimmed || trimmed.length < 4) return Promise.resolve(null);

  // Check if an identical request is already running
  if (inFlightAnalysisPromise &&
    inFlightAnalysisParams?.prompt === trimmed &&
    inFlightAnalysisParams?.month === month &&
    JSON.stringify(inFlightAnalysisParams?.answers) === JSON.stringify(answers)) {
    return inFlightAnalysisPromise;
  }

  inFlightAnalysisParams = { prompt: trimmed, answers, month };
  notifySubscribers({ type: 'start', params: inFlightAnalysisParams });

  const promise = api.analyzeGoalLive(trimmed, answers, month)
    .then(res => {
      if (res) {
        // Persist draft to localStorage
        try {
          const draftData = {
            prompt: trimmed,
            answers,
            month,
            liveAnalysis: res,
            updatedAt: Date.now()
          };
          localStorage.setItem(`reviser_monthly_draft_${month}`, JSON.stringify(draftData));
        } catch (_) { }

        // Persist draft to backend DB so it survives app reloads & navigation
        api.saveGoalDraft({
          month,
          userGoalPrompt: trimmed,
          aiAnalysis: res
        }).catch(() => { });

        notifySubscribers({ type: 'success', data: res, params: inFlightAnalysisParams });
        return res;
      }
      return null;
    })
    .catch(err => {
      const errMsg = err?.message || 'Network error communicating with Gemini API';
      notifySubscribers({ type: 'error', error: errMsg, params: inFlightAnalysisParams });
      throw err;
    })
    .finally(() => {
      inFlightAnalysisPromise = null;
    });

  inFlightAnalysisPromise = promise;
  return promise;
}

const generateLocalFallbackPlan = (prompt, answers = {}) => {
  const lower = prompt ? prompt.toLowerCase() : '';
  let totalTarget = 60;
  const match = lower.match(/(\d{1,3})\s*(?:problems?|questions?|tasks?|items?)/);
  if (match) {
    totalTarget = Math.max(15, Math.min(250, parseInt(match[1], 10)));
  }

  const dsaCount = Math.round(totalTarget * 0.65);
  const osDbmsCount = Math.max(12, Math.round(totalTarget * 0.20));
  const buildCount = Math.max(8, totalTarget - dsaCount - osDbmsCount);
  const dailyPace = Math.max(1, Math.round((totalTarget / 28) * 10) / 10);

  return {
    intent: prompt ? prompt.slice(0, 100) : "SDE Interview Sprint & Systems Prep",
    feasibility: {
      score: 88,
      verdict: "Realistic & High ROI",
      estimatedDailyHours: Math.round(dailyPace * 1.1 * 10) / 10,
      pacingVerdict: "Good daily consistency with manageable cognitive load across DSA patterns and core CS theory."
    },
    targets: {
      overallTarget: totalTarget,
      dailyTarget: dailyPace,
      categories: [
        { category: 'dsa', targetCount: dsaCount },
        { category: 'os_dbms', targetCount: osDbmsCount },
        { category: 'build', targetCount: buildCount }
      ]
    },
    weeklyMilestones: [
      { week: 1, theme: "Arrays, Sliding Window & Core Database Indexing", target: Math.ceil(totalTarget * 0.25), focus: "Pointer boundary invariants and B+ Tree mechanics" },
      { week: 2, theme: "Binary Trees, Recursion & OS Process Concurrency", target: Math.ceil(totalTarget * 0.25), focus: "Tree DFS/BFS paths and Semaphores / Deadlock avoidance" },
      { week: 3, theme: "Dynamic Programming & Spring Boot Architecture", target: Math.ceil(totalTarget * 0.25), focus: "Knapsack patterns, Subsequences and REST design with clean contracts" },
      { week: 4, theme: "Graph Traversal, Timed Drills & Capstone Polish", target: Math.ceil(totalTarget * 0.25), focus: "Dijkstra, Topological sort and timed mock interview drills" }
    ],
    strengths: [
      "Targeted focus directly combining algorithmic patterns with system fundamentals",
      "Disciplined daily slicing matches standard spaced repetition intervals"
    ],
    blindSpots: [
      "Ensure OS and DBMS theory doesn't get pushed aside during difficult DSA days",
      "Track daily recall to prevent memory decay on problems solved early in the month"
    ],
    tacticalRecommendations: [
      "Solve DSA problems in 45-minute timed windows without looking at solutions early",
      "Review yesterday's LeetCode problems first thing each morning before tackling new topics"
    ]
  };
};

export default function MonthlyGoals() {
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthKey);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real-Time Debounced Natural Language Studio States
  const [showAiStudio, setShowAiStudio] = useState(false);
  const [goalPrompt, setGoalPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [answers, setAnswers] = useState({});
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [analysisError, setAnalysisError] = useState(null);

  // Staged AI Studio Navigation (1 = Goal Vision & Topics, 2 = AI Strategy & Questions, 3 = Sliced Blueprint & Finalise)
  const [aiStudioStep, setAiStudioStep] = useState(1);

  // Custom opinion inputs per question id
  const [customOpinionInputs, setCustomOpinionInputs] = useState({});
  const [activeCustomInputId, setActiveCustomInputId] = useState(null);

  // Off Day preference schedule state
  const [offDaySchedule, setOffDaySchedule] = useState('Sunday Off Day (1 day off/week)');

  // Typing debounce timer ref
  const debounceTimerRef = useRef(null);

  // Manual target addition state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedPresetCat, setSelectedPresetCat] = useState('DSA');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newCount, setNewCount] = useState(15);
  const [goalStatus, setGoalStatus] = useState('DRAFT'); // 'DRAFT' or 'ACCEPTED'
  const [rescheduleEvaluations, setRescheduleEvaluations] = useState({});

  const handleAskGeminiRescheduling = async (target) => {
    const cat = target.category;
    setRescheduleEvaluations(prev => ({
      ...prev,
      [cat]: { ...prev[cat], loading: true }
    }));
    try {
      const res = await api.evaluateRescheduling({
        stepTitle: target.category,
        category: target.category,
        targetCount: target.targetCount,
        completedCount: target.completedCount || 0,
        context: `Sam 3-Month Roadmap (11 Sept to 11 Dec 2026). Current month: ${currentMonthKey}.`
      });
      setRescheduleEvaluations(prev => ({
        ...prev,
        [cat]: {
          decision: res.decision || (res.rescheduleRecommended ? 'YES' : 'NO'),
          rationale: res.rationale || '',
          adjustment: res.suggestedAdjustment || '',
          loading: false
        }
      }));
    } catch (err) {
      setRescheduleEvaluations(prev => ({
        ...prev,
        [cat]: {
          decision: 'NO',
          rationale: 'Could not contact Gemini: ' + err.message + '. Pacing remains valid.',
          adjustment: 'Stay on track.',
          loading: false
        }
      }));
    }
  };

  // Load targets and saved AI plan from PostgreSQL database
  const loadGoals = () => {
    setLoading(true);
    api.getCurrentMonthGoal()
      .then(data => {
        if (data) {
          if (data.status) {
            setGoalStatus(data.status);
          } else if (data.targets && data.targets.length > 0) {
            setGoalStatus('ACCEPTED');
          }

          if (Array.isArray(data.targets) && data.targets.length > 0) {
            setTargets(data.targets.map(t => ({
              category: t.category,
              targetCount: t.targetCount,
              completedCount: t.completedCount || 0
            })));
          }

          // Hydrate saved AI analysis and prompt from DB if present
          if (data.userGoalPrompt) {
            setGoalPrompt(prev => prev || data.userGoalPrompt);
          }
          if (data.aiAnalysis) {
            setLiveAnalysis(prev => prev || data.aiAnalysis);
            setLastAnalyzedAt(new Date(data.createdAt || Date.now()));
          }
        }

        // Also check localStorage for any pending draft or newer session
        try {
          const cached = localStorage.getItem(`reviser_monthly_draft_${currentMonthKey}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.prompt) setGoalPrompt(prev => prev || parsed.prompt);
            if (parsed.answers) setAnswers(prev => Object.keys(prev).length ? prev : parsed.answers);
            if (parsed.liveAnalysis) {
              setLiveAnalysis(prev => prev || parsed.liveAnalysis);
              if (parsed.updatedAt) setLastAnalyzedAt(new Date(parsed.updatedAt));
            }
          }
        } catch (_) { }
      })
      .catch(() => {
        // If DB has no record yet, still restore from localStorage
        try {
          const cached = localStorage.getItem(`reviser_monthly_draft_${currentMonthKey}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.prompt) setGoalPrompt(parsed.prompt);
            if (parsed.answers) setAnswers(parsed.answers || {});
            if (parsed.liveAnalysis) {
              setLiveAnalysis(parsed.liveAnalysis);
              if (parsed.updatedAt) setLastAnalyzedAt(new Date(parsed.updatedAt));
            }
          }
        } catch (_) { }
      })
      .finally(() => setLoading(false));
  };

  // Subscribe to background analysis events and hydrate on mount
  useEffect(() => {
    loadGoals();

    // Check if an analysis is already in flight when mounting
    if (inFlightAnalysisPromise) {
      setIsAnalyzing(true);
      setAnalysisError(null);
    }

    const subscriber = (event) => {
      if (event.type === 'start') {
        setIsAnalyzing(true);
        setAnalysisError(null);
      } else if (event.type === 'success') {
        setIsAnalyzing(false);
        setLiveAnalysis(event.data);
        setLastAnalyzedAt(new Date());
        setAnalysisError(null);
      } else if (event.type === 'error') {
        setIsAnalyzing(false);
        setAnalysisError(event.error);
      }
    };

    analysisSubscribers.add(subscriber);
    return () => {
      analysisSubscribers.delete(subscriber);
    };
  }, []);

  const totalTarget = targets.reduce((acc, t) => acc + (t.targetCount || 0), 0);
  const totalCompleted = targets.reduce((acc, t) => acc + (t.completedCount || 0), 0);
  const totalPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  // Deterministic daily slicing calculations
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());
  const dailyTargetCalculated = totalTarget > 0
    ? Math.max(1, Math.round(((totalTarget - totalCompleted) / daysRemaining) * 10) / 10)
    : 0;

  // Handle typing with auto-save to localStorage and gentle debounced trigger
  const handlePromptChange = (val) => {
    setGoalPrompt(val);
    setAnalysisError(null);

    // Persist draft text immediately to localStorage so switching tabs never loses input
    try {
      const cached = localStorage.getItem(`reviser_monthly_draft_${month}`) || '{}';
      const parsed = JSON.parse(cached);
      localStorage.setItem(`reviser_monthly_draft_${month}`, JSON.stringify({
        ...parsed,
        prompt: val,
        month,
        updatedAt: Date.now()
      }));
    } catch (_) { }

    // Gentle 2.5s idle auto-analyze (only if user stops typing and text is substantial)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length >= 15) {
      debounceTimerRef.current = setTimeout(() => {
        startBackgroundAnalysis(val, answers, month);
      }, 2500);
    }
  };

  // Immediate manual trigger for button clicks or presets
  const triggerImmediateAnalysis = (customPrompt, customAnswers) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const promptToUse = (customPrompt !== undefined ? customPrompt : goalPrompt).trim();
    if (!promptToUse) return;

    setAnalysisError(null);
    startBackgroundAnalysis(promptToUse, customAnswers !== undefined ? customAnswers : answers, month);
  };

  const handleSelectAnswer = (qId, option) => {
    const updated = { ...answers, [qId]: option };
    setAnswers(updated);
    if (goalPrompt.trim().length >= 4) {
      triggerImmediateAnalysis(goalPrompt, updated);
    }
  };

  const handleSaveCustomOpinion = (qId) => {
    const customText = (customOpinionInputs[qId] || '').trim();
    if (!customText) return;
    const updated = { ...answers, [qId]: customText };
    setAnswers(updated);
    setActiveCustomInputId(null);
    if (goalPrompt.trim().length >= 4) {
      triggerImmediateAnalysis(goalPrompt, updated);
    }
  };

  const handleSelectOffDay = (offDayChoice) => {
    setOffDaySchedule(offDayChoice);
    const updated = { ...answers, off_day_schedule: offDayChoice };
    setAnswers(updated);
    if (goalPrompt.trim().length >= 4) {
      triggerImmediateAnalysis(goalPrompt, updated);
    }
  };

  // Instant local calibration fallback when Gemini is slow or offline
  const handleUseLocalFallback = () => {
    const plan = generateLocalFallbackPlan(goalPrompt, answers);
    setLiveAnalysis(plan);
    setLastAnalyzedAt(new Date());
    setAnalysisError(null);
    setIsAnalyzing(false);

    try {
      localStorage.setItem(`reviser_monthly_draft_${month}`, JSON.stringify({
        prompt: goalPrompt,
        answers,
        month,
        liveAnalysis: plan,
        updatedAt: Date.now()
      }));
    } catch (_) { }

    api.saveGoalDraft({
      month,
      userGoalPrompt: goalPrompt,
      aiAnalysis: plan
    }).catch(() => { });
  };

  const handleApplyLivePlan = async () => {
    const recTargets = liveAnalysis?.targets?.categories;
    if (!recTargets || recTargets.length === 0) return;

    try {
      setSaving(true);
      const newTargets = recTargets.map(t => ({
        category: t.category || 'dsa',
        targetCount: t.targetCount || 20,
        completedCount: 0
      }));

      const goalData = {
        month: currentMonthKey,
        targets: newTargets,
        priorityOrder: newTargets.map(t => t.category),
        userGoalPrompt: goalPrompt,
        aiAnalysis: liveAnalysis,
        status: 'ACCEPTED'
      };

      await api.setMonthlyGoal(goalData);
      setTargets(newTargets);
      setGoalStatus('ACCEPTED');
      setShowAiStudio(false);
      setApplySuccessMsg('✓ 3-Month Roadmap Plan Accepted & Active in Database!');

      confetti({
        particleCount: 70,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#0ea5a4', '#059669', '#d97706']
      });

      setTimeout(() => setApplySuccessMsg(''), 5000);
    } catch (err) {
      alert('Error saving targets to database: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Manual target management with Roadmap Categories & Custom Category option
  const handleAddManualTarget = async (e) => {
    e.preventDefault();
    const finalCat = selectedPresetCat === '__custom__' ? customCategoryName.trim() : selectedPresetCat;
    if (!finalCat) return;

    const updated = [
      ...targets.filter(t => t.category.toLowerCase() !== finalCat.toLowerCase()),
      { category: finalCat, targetCount: parseInt(newCount, 10) || 10, completedCount: 0 }
    ];

    try {
      await api.setMonthlyGoal({
        month: currentMonthKey,
        targets: updated,
        priorityOrder: updated.map(t => t.category),
        userGoalPrompt: goalPrompt,
        aiAnalysis: liveAnalysis,
        status: 'ACCEPTED'
      });
      setTargets(updated);
      setGoalStatus('ACCEPTED');
      setShowAddModal(false);
      setCustomCategoryName('');
      setNewCategory('');
      setNewCount(15);
    } catch (err) {
      alert('Error adding target: ' + err.message);
    }
  };

  const handleDeleteTarget = async (categoryToDelete) => {
    if (!window.confirm(`Remove "${categoryToDelete}" from this month's targets?`)) return;

    const updated = targets.filter(t => t.category !== categoryToDelete);
    try {
      await api.setMonthlyGoal({
        month: currentMonthKey,
        targets: updated,
        priorityOrder: updated.map(t => t.category),
        userGoalPrompt: goalPrompt,
        aiAnalysis: liveAnalysis
      });
      setTargets(updated);
    } catch (err) {
      alert('Error removing target: ' + err.message);
    }
  };

  return (
    <div className="rv-container">
      {/* Editorial Header */}
      <header className="rv-hero" style={{ marginBottom: '24px' }}>
        <div className="rv-eyebrow">Target Calibration &amp; Slicing Engine</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="rv-greet font-serif" style={{ fontSize: '2.2rem' }}>
              Monthly <em>Target Planning</em>
            </h1>
            <p className="rv-sub" style={{ marginTop: '6px' }}>
              Express your unique monthly goals in freeform natural language. Gemini AI decodes your intent, asks intelligent cross-questions, and deterministically slices your milestones into disciplined daily study loads.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.84rem' }}
            >
              <Plus size={15} />
              <span>Add Custom Target</span>
            </button>
            <button
              onClick={() => setShowAiStudio(!showAiStudio)}
              className="btn-primary"
              style={{ padding: '9px 16px', fontSize: '0.84rem' }}
            >
              <Sparkles size={15} />
              <span>{showAiStudio ? 'Close Natural Language Studio' : 'Plan with Natural Language AI'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Accepted Roadmap Banner */}
      {goalStatus === 'ACCEPTED' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(14, 165, 164, 0.08) 100%)',
          border: '1.5px solid rgba(5, 150, 105, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              color: '#0c0e14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              flexShrink: 0
            }}>
              <Check size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-serif-title)' }}>
                  3-Month Roadmap Plan: Accepted &amp; Active
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--color-green-subtle)',
                  color: 'var(--color-green)',
                  border: '1px solid rgba(5, 150, 105, 0.3)'
                }}>
                  ACCEPTED · 11 SEPT 2026 → 11 DEC 2026
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Your study roadmap is accepted and actively driving daily slicing and spaced repetition. Priority targets: DSA, Core CS, Workers Den, Spring Boot Drill, and Open Source.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowAiStudio(!showAiStudio)}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            >
              <Sparkles size={14} />
              <span>{showAiStudio ? 'Close Studio' : 'Recalibrate / Edit Roadmap'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Slicing Metrics Panel (Live DB Connected) */}
      <section className="rv-glance" style={{ marginBottom: '24px' }}>
        <div className="rv-glance-cell">
          <div className="rv-glance-num" style={{ color: 'var(--accent-cyan)' }}>
            {dailyTargetCalculated}
          </div>
          <div className="rv-glance-cap">
            Daily Slice Target
            <b>Items per day</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num" style={{ color: 'var(--accent-emerald)' }}>
            {totalCompleted} <small>/ {totalTarget}</small>
          </div>
          <div className="rv-glance-cap">
            Monthly Progress
            <b>{totalPercent}% completed</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num">
            {Math.max(0, totalTarget - totalCompleted)}
          </div>
          <div className="rv-glance-cap">
            Remaining Load
            <b>Problems &amp; topics</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num">
            {daysRemaining}
          </div>
          <div className="rv-glance-cap">
            Days Remaining
            <b>In {new Date().toLocaleString('en-US', { month: 'long' })}</b>
          </div>
        </div>
      </section>

      {/* ==================== REAL-TIME DYNAMIC AI GOAL CALIBRATION STUDIO ==================== */}
      {showAiStudio && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,237,185,0.35) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-card)',
          animation: 'fadeIn 0.25s var(--ease-soft) forwards'
        }}>
          {/* Studio Header & Real-Time Sync Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-parchment)',
                border: '1px solid #ebd7a3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} color="#8a6508" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: '600', color: 'var(--text-serif-title)', margin: 0 }}>
                    Real-Time Goal Calibration Studio
                  </h3>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'var(--primary-light)',
                    color: 'var(--color-blue)',
                    border: '1px solid rgba(14,165,164,0.2)'
                  }}>
                    GEMINI 3.6 FLASH LIVE
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Type freely. Gemini analyzes what you type in real-time — testing feasibility pacing, diagnosing blind spots, providing tactical guidance, and dynamically posing cross-questions.
                </p>
              </div>
            </div>

            {/* Live Typing / Sync Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isAnalyzing ? 'var(--primary-light)' : 'var(--bg-card-inset)',
                border: '1px solid',
                borderColor: isAnalyzing ? 'var(--color-blue)' : 'var(--border-subtle)',
                fontSize: '0.78rem',
                transition: 'all 0.2s ease'
              }}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={13} className="spin" color="var(--color-blue)" />
                    <span style={{ color: 'var(--color-blue)', fontWeight: '600' }}>
                      Gemini analyzing live...
                    </span>
                  </>
                ) : lastAnalyzedAt ? (
                  <>
                    <Check size={13} color="var(--color-green)" />
                    <span style={{ color: 'var(--color-green)', fontWeight: '600' }}>
                      Live synced ({lastAnalyzedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>
                    Type your vision to analyze live
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowAiStudio(false)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                title="Close Studio"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Success Banner if targets were just applied */}
          {applySuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(5, 150, 105, 0.12)',
              border: '1px solid var(--color-green)',
              color: 'var(--color-green)',
              marginBottom: '20px',
              fontSize: '0.86rem',
              fontWeight: '600'
            }}>
              <CheckCircle2 size={18} />
              <span>{applySuccessMsg}</span>
            </div>
          )}

          {/* Network / Parsing Error Alert with Local Calibration Fallback */}
          {analysisError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--text-main)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <span style={{ fontSize: '0.86rem' }}>
                  <strong>Gemini notice:</strong> {analysisError}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => triggerImmediateAnalysis()}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  <span>Retry Gemini</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseLocalFallback}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <span>Use Local Calibration</span>
                </button>
              </div>
            </div>
          )}

          {/* Step Indicator Bar with #FFEDB9 Styling */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'rgba(255, 237, 185, 0.45)',
            border: '1px solid #ebd7a3',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            marginBottom: '22px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { num: 1, label: '1. Vision & DSA Topics' },
                { num: 2, label: '2. AI Strategy & Diagnostic Questions' },
                { num: 3, label: '3. Roadmap & Finalise' }
              ].map((step) => {
                const isActive = aiStudioStep === step.num;
                const isPassed = aiStudioStep > step.num;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => {
                      if (step.num === 1 || liveAnalysis || goalPrompt.trim()) {
                        setAiStudioStep(step.num);
                        if (!liveAnalysis && step.num > 1 && goalPrompt.trim().length >= 4) {
                          triggerImmediateAnalysis();
                        }
                      }
                    }}
                    style={{
                      background: isActive ? '#FFEDB9' : (isPassed ? 'rgba(255,237,185,0.25)' : 'transparent'),
                      border: isActive ? '1.5px solid #d4b35f' : '1px solid rgba(212, 179, 95, 0.3)',
                      color: isActive ? '#784d02' : (isPassed ? 'var(--color-green)' : 'var(--text-muted)'),
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.82rem',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isPassed ? <Check size={13} color="var(--color-green)" /> : null}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#784d02', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
              STEP {aiStudioStep} OF 3
            </div>
          </div>

          {/* ==================== STEP 1: VISION & DSA TOPICS ==================== */}
          {aiStudioStep === 1 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              {/* Real-Time Goal Input Area */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-serif-title)' }}>
                    1. What do you want to achieve this month? (Auto-saved across reloads)
                  </label>
                  {goalPrompt.length > 0 && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {goalPrompt.length} chars
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    value={goalPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="e.g. I have upcoming SDE-2 interviews in 4 weeks. I want to solve 60 problems with heavy focus on Sliding Window, Trees, and Dynamic Programming. I study 2.5 hours on weekdays and 4 hours on weekends, plus I need 1 hour daily for my Spring Boot project..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      borderRadius: 'var(--radius-md)',
                      border: isAnalyzing ? '1px solid var(--color-blue)' : '1px solid var(--border-main)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      boxShadow: isAnalyzing ? '0 0 0 3px rgba(14,165,164,0.1)' : 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  />
                </div>

                {/* Quick Starter Chips & Controls */}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Starters:
                    </span>
                    {QUICK_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handlePromptChange(p.desc);
                          triggerImmediateAnalysis(p.desc);
                        }}
                        type="button"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.76rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-card-inset)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <strong>{p.title}</strong>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {goalPrompt.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          handlePromptChange('');
                          setLiveAnalysis(null);
                          setAnswers({});
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => triggerImmediateAnalysis()}
                      disabled={isAnalyzing || !goalPrompt.trim()}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={13} className={isAnalyzing ? 'spin' : ''} />
                      <span>{isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze Goal with Gemini'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 1 Footer Action Bar with Next Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!liveAnalysis && goalPrompt.trim().length >= 4) {
                      triggerImmediateAnalysis();
                    }
                    setAiStudioStep(2);
                  }}
                  disabled={!goalPrompt.trim()}
                  style={{
                    background: '#FFEDB9',
                    border: '1.5px solid #d4b35f',
                    color: '#784d02',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-md)',
                    cursor: goalPrompt.trim() ? 'pointer' : 'not-allowed',
                    opacity: goalPrompt.trim() ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(120, 77, 2, 0.12)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Next: AI Strategy &amp; Diagnostic Questions</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: AI STRATEGY & DIAGNOSTIC QUESTIONS ==================== */}
          {aiStudioStep === 2 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              {!liveAnalysis && !isAnalyzing ? (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Sparkles size={28} color="var(--color-blue)" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: '600', color: 'var(--text-serif-title)', fontSize: '1rem', marginBottom: '6px' }}>
                    Gemini analysis is pending for your goal
                  </div>
                  <p style={{ fontSize: '0.84rem', margin: '0 0 16px 0' }}>
                    Click below to trigger instant real-time AI strategic calibration.
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerImmediateAnalysis()}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                  >
                    Analyze Now with Gemini
                  </button>
                </div>
              ) : null}

              {liveAnalysis && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Intent Summary Pill */}
                  {liveAnalysis.intent && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.84rem'
                    }}>
                      <Compass size={16} color="var(--color-blue)" />
                      <span style={{ color: 'var(--text-muted)' }}>Target Intent:</span>
                      <strong style={{ color: 'var(--text-serif-title)' }}>{liveAnalysis.intent}</strong>
                    </div>
                  )}

                  {/* Panel 1: Feasibility & Pacing Engine */}
                  {liveAnalysis.feasibility && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 22px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Gauge size={18} color="var(--color-blue)" />
                          <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                            Feasibility &amp; Pacing Calibration
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: (liveAnalysis.feasibility.score >= 80)
                              ? 'rgba(5,150,105,0.12)'
                              : (liveAnalysis.feasibility.score >= 65)
                                ? 'rgba(217,119,6,0.14)'
                                : 'rgba(220,38,38,0.12)',
                            color: (liveAnalysis.feasibility.score >= 80)
                              ? 'var(--color-green)'
                              : (liveAnalysis.feasibility.score >= 65)
                                ? 'var(--color-amber)'
                                : 'var(--accent-rose)',
                            border: '1px solid currentColor'
                          }}>
                            {liveAnalysis.feasibility.verdict || 'Calibrated Pace'}
                          </span>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            color: 'var(--text-serif-title)'
                          }}>
                            {liveAnalysis.feasibility.score} / 100
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar for Feasibility */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg-card-inset)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '14px'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(10, liveAnalysis.feasibility.score || 75))}%`,
                          background: (liveAnalysis.feasibility.score >= 80)
                            ? 'linear-gradient(90deg, #059669, #10b981)'
                            : (liveAnalysis.feasibility.score >= 65)
                              ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                              : 'linear-gradient(90deg, #dc2626, #ef4444)',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-card-inset)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>ESTIMATED STUDY LOAD</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-serif-title)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                            ~{liveAnalysis.feasibility.hoursPerDayEstimate || 2.5} hrs / day
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            ~{liveAnalysis.feasibility.weeklyHoursEstimate || 17.5} hrs weekly total
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-card-inset)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>PACING VERDICT</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.4' }}>
                            {liveAnalysis.feasibility.pacingAssessment || 'Pacing provides strong consistency while mitigating cognitive fatigue.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Panel 2: Dual Strategy Matrix (Strengths vs. Critical Blind Spots) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {/* Strengths */}
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <CheckCircle2 size={17} color="var(--color-green)" />
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                          Strategy Strengths Identified
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(liveAnalysis.strengths || ['Clear quantitative targets']).map((str, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '0.82rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.4'
                          }}>
                            <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>✓</span>
                            <span>{str}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blind Spots / Missing Elements */}
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <AlertTriangle size={17} color="var(--color-amber)" />
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                          Critical Blind Spots &amp; Gaps Detected
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(liveAnalysis.blindSpots && liveAnalysis.blindSpots.length > 0
                          ? liveAnalysis.blindSpots
                          : ['No explicit spaced repetition catch-up days scheduled']
                        ).map((b, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '0.82rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.4'
                          }}>
                            <span style={{ color: 'var(--color-amber)', fontWeight: 'bold' }}>⚠</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Tactical Recommendations */}
                  {liveAnalysis.tacticalSuggestions && liveAnalysis.tacticalSuggestions.length > 0 && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 22px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <Zap size={17} color="var(--color-purple)" />
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                          Proactive Tactical Recommendations
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                        {liveAnalysis.tacticalSuggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--bg-card-inset)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px 14px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '1rem' }}>{sug.icon || '⚡'}</span>
                              <strong style={{ fontSize: '0.84rem', color: 'var(--text-serif-title)' }}>
                                {sug.title}
                              </strong>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                              {sug.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Panel 4: Dynamic Clarifying Questions WITH CUSTOM OPINION INPUT */}
                  {liveAnalysis.questions && liveAnalysis.questions.length > 0 && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 22px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lightbulb size={18} color="var(--color-amber)" />
                          <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                            Dynamic Clarifying Diagnostic Questions
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerImmediateAnalysis()}
                          disabled={isAnalyzing}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px', opacity: isAnalyzing ? 0.6 : 1 }}
                          title="Re-run Gemini now to refresh / fetch the next diagnostic questions"
                        >
                          <Sparkles size={13} className={isAnalyzing ? 'spin' : ''} />
                          <span>{isAnalyzing ? 'Analyzing…' : 'Refresh questions'}</span>
                        </button>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        Select auto-suggested options or add your own custom opinion / DSA topics below to calibrate your curriculum in real-time:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {liveAnalysis.questions.map((q) => {
                          const isCustomSelected = answers[q.id] && !q.options?.includes(answers[q.id]);
                          return (
                            <div
                              key={q.id}
                              style={{
                                background: 'var(--bg-card-inset)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: '14px 18px'
                              }}
                            >
                              <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '10px' }}>
                                {q.question}
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                {q.options?.map((opt) => {
                                  const isSelected = answers[q.id] === opt || (!answers[q.id] && opt === q.defaultAnswer);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleSelectAnswer(q.id, opt)}
                                      style={{
                                        fontSize: '0.8rem',
                                        padding: '7px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid',
                                        borderColor: isSelected ? 'var(--color-blue)' : 'var(--border-subtle)',
                                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                                        color: isSelected ? 'var(--color-blue)' : 'var(--text-main)',
                                        fontWeight: isSelected ? '700' : '400',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      <span>{opt}</span>
                                      {isSelected && <Check size={13} color="var(--color-blue)" />}
                                    </button>
                                  );
                                })}

                                {/* Active custom opinion pill if user typed their own response */}
                                {isCustomSelected && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1.5px solid #d4b35f',
                                    background: '#FFEDB9',
                                    color: '#784d02',
                                    fontWeight: '700'
                                  }}>
                                    <Check size={13} color="#784d02" />
                                    <span>Opinion: {answers[q.id]}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCustomInputId(q.id);
                                        setCustomOpinionInputs({ ...customOpinionInputs, [q.id]: answers[q.id] });
                                      }}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px', fontSize: '0.78rem' }}
                                      title="Edit opinion"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}

                                {/* Add Custom Opinion Toggle Button */}
                                {activeCustomInputId !== q.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCustomInputId(q.id);
                                      setCustomOpinionInputs({ ...customOpinionInputs, [q.id]: answers[q.id] || '' });
                                    }}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '6px 12px',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px dashed #d4b35f',
                                      background: 'rgba(255, 237, 185, 0.35)',
                                      color: '#784d02',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Plus size={12} />
                                    <span>Add Custom Opinion / Topics</span>
                                  </button>
                                )}
                              </div>

                              {/* Inline Custom Opinion Form */}
                              {activeCustomInputId === q.id && (
                                <div style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginTop: '10px',
                                  background: 'var(--bg-card)',
                                  border: '1.5px solid #ebd7a3',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '8px 10px',
                                  alignItems: 'center',
                                  boxShadow: '0 2px 6px rgba(120, 77, 2, 0.08)'
                                }}>
                                  <input
                                    type="text"
                                    placeholder="Type your own opinion, specific DSA topics, or custom schedule..."
                                    value={customOpinionInputs[q.id] || ''}
                                    onChange={(e) => setCustomOpinionInputs({ ...customOpinionInputs, [q.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveCustomOpinion(q.id);
                                      }
                                    }}
                                    autoFocus
                                    style={{
                                      flex: 1,
                                      border: '1px solid var(--border-main)',
                                      borderRadius: '4px',
                                      padding: '7px 10px',
                                      fontSize: '0.84rem',
                                      background: 'var(--bg-card-inset)',
                                      color: 'var(--text-main)',
                                      outline: 'none'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCustomOpinion(q.id)}
                                    style={{
                                      background: '#FFEDB9',
                                      border: '1px solid #d4b35f',
                                      color: '#784d02',
                                      fontWeight: '700',
                                      fontSize: '0.8rem',
                                      padding: '7px 14px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Save Opinion
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveCustomInputId(null)}
                                    className="btn-secondary"
                                    style={{ padding: '7px 10px', fontSize: '0.8rem' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dedicated Off Day & Rest Day Pacing Card with #FFEDB9 Accent */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255,237,185,0.45) 0%, var(--bg-card) 100%)',
                    border: '1.5px solid #ebd7a3',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 22px',
                    boxShadow: 'var(--shadow-card)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#FFEDB9',
                          border: '1px solid #d4b35f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Coffee size={17} color="#784d02" />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.94rem', fontWeight: '700', color: '#784d02' }}>
                            Off Day &amp; Rest Day Pacing Scheduler
                          </span>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Choose your weekly off day to prevent burnout and ensure cognitive recovery for hard DSA concepts.
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: '#FFEDB9',
                        color: '#784d02',
                        border: '1px solid #d4b35f'
                      }}>
                        OFF DAY: {offDaySchedule || answers.off_day_schedule || 'Sunday Off Day (1 day off/week)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {[
                        'Sunday Off Day (1 day off/week)',
                        'Saturday & Sunday Off (Weekends off)',
                        '1 Floating Midweek Off Day (Wednesday)',
                        'No Off Days (Intensive 7-Day Sprint)'
                      ].map((opt) => {
                        const isSel = (answers.off_day_schedule === opt) || (!answers.off_day_schedule && opt.startsWith('Sunday'));
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOffDay(opt)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '8px 14px',
                              borderRadius: 'var(--radius-sm)',
                              border: isSel ? '1.5px solid #d4b35f' : '1px solid var(--border-subtle)',
                              background: isSel ? '#FFEDB9' : 'var(--bg-card)',
                              color: isSel ? '#784d02' : 'var(--text-main)',
                              fontWeight: isSel ? '700' : '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSel && <Check size={13} color="#784d02" />}
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2 Footer Navigation Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setAiStudioStep(1)}
                      className="btn-secondary"
                      style={{ padding: '9px 18px', fontSize: '0.84rem' }}
                    >
                      ← Back: Goal Vision
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiStudioStep(3)}
                      style={{
                        background: '#FFEDB9',
                        border: '1.5px solid #d4b35f',
                        color: '#784d02',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        padding: '10px 22px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 10px rgba(120, 77, 2, 0.12)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>Next: Review Blueprint &amp; Finalise</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== STEP 3: ROADMAP & FINALISE ==================== */}
          {aiStudioStep === 3 && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              {!liveAnalysis ? (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Target size={28} color="var(--color-blue)" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: '600', color: 'var(--text-serif-title)', fontSize: '1rem', marginBottom: '6px' }}>
                    No Sliced Curriculum Generated Yet
                  </div>
                  <p style={{ fontSize: '0.84rem', margin: '0 0 16px 0' }}>
                    Please complete Step 1 and analyze your goal to generate your monthly curriculum blueprint.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAiStudioStep(1)}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                  >
                    Go to Step 1: Vision
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Live Sliced Curriculum & 4-Week Milestones Preview */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px 26px',
                    boxShadow: 'var(--shadow-card)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                      <div>
                        <div className="mono-label" style={{ color: 'var(--color-blue)' }}>Live Sliced Blueprint</div>
                        <h4 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--text-serif-title)', margin: '2px 0 0 0' }}>
                          Calibrated Monthly Curriculum Preview
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-green)', fontWeight: '600', marginTop: '3px' }}>
                          Daily Slice Pace: ~{liveAnalysis.targets?.dailyTarget || 2} items / day &middot; Total Volume: {liveAnalysis.targets?.overallTarget || 60} items
                        </div>
                      </div>

                      {/* Prominent Finalise Action Button */}
                      <button
                        onClick={handleApplyLivePlan}
                        disabled={saving}
                        style={{
                          background: '#FFEDB9',
                          border: '2px solid #d4b35f',
                          color: '#784d02',
                          fontWeight: '800',
                          fontSize: '0.92rem',
                          padding: '10px 22px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 3px 12px rgba(120, 77, 2, 0.16)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Check size={17} color="#784d02" />
                        <span>{saving ? 'Saving...' : 'Finalise & Apply Monthly Plan'}</span>
                      </button>
                    </div>

                    {/* Sliced Category Targets */}
                    {liveAnalysis.targets?.categories && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          CATEGORY BREAKDOWN:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          {liveAnalysis.targets.categories.map((t, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: 'var(--bg-card-inset)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                                {t.category}
                              </span>
                              <span style={{ fontSize: '0.94rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: 'var(--color-blue)' }}>
                                {t.targetCount} items
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4-Week Milestone Roadmap */}
                    {liveAnalysis.weeklyMilestones && liveAnalysis.weeklyMilestones.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          4-WEEK PROGRESSIVE MILESTONES:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                          {liveAnalysis.weeklyMilestones.map((w, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: 'var(--bg-card-inset)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 14px'
                              }}
                            >
                              <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: 'var(--color-blue)' }}>
                                WEEK {w.week || idx + 1}: {w.target ? `${w.target} items` : ''}
                              </div>
                              <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-serif-title)', marginTop: '3px' }}>
                                {w.theme}
                              </div>
                              {w.focus && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                                  {w.focus}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tactical Recommendations preview in Step 3 */}
                  {liveAnalysis.tacticalRecommendations && liveAnalysis.tacticalRecommendations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={14} />
                        <span>Tactical Highlights:</span>
                      </span>
                      {liveAnalysis.tacticalRecommendations.map((rec, idx) => (
                        <span key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card-inset)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                          &bull; {rec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Step 3 Footer Navigation Bar with Prominent Finalise Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '22px',
                    paddingTop: '18px',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setAiStudioStep(2)}
                      className="btn-secondary"
                      style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                    >
                      ← Back: Questions &amp; Off Days
                    </button>

                    <button
                      onClick={handleApplyLivePlan}
                      disabled={saving}
                      style={{
                        background: '#FFEDB9',
                        border: '2px solid #d4b35f',
                        color: '#784d02',
                        fontWeight: '800',
                        fontSize: '0.96rem',
                        padding: '12px 28px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(120, 77, 2, 0.2)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Check size={18} color="#784d02" />
                      <span>{saving ? 'Saving to Database...' : 'Finalise & Apply Monthly Plan'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== PERSISTENT AI BLUEPRINT & ROADMAP (WHEN STUDIO COLLAPSED) ==================== */}
      {!showAiStudio && liveAnalysis && (
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-parchment)',
                border: '1px solid #ebd7a3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} color="#8a6508" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-serif-title)', margin: 0 }}>
                    Active AI Study Trajectory &amp; Roadmap
                  </h3>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'var(--primary-light)',
                    color: 'var(--color-blue)'
                  }}>
                    GEMINI CALIBRATED
                  </span>
                </div>
                {liveAnalysis.intent && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Target: <strong>{liveAnalysis.intent}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowAiStudio(true)}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={13} />
                <span>Refine in AI Studio</span>
              </button>
            </div>
          </div>

          {/* Feasibility & Pace Summary */}
          {liveAnalysis.feasibility && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ background: 'var(--bg-card-inset)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>FEASIBILITY &amp; PACE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: (liveAnalysis.feasibility.score >= 80) ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.14)',
                    color: (liveAnalysis.feasibility.score >= 80) ? 'var(--color-green)' : 'var(--color-amber)',
                    border: '1px solid currentColor'
                  }}>
                    {liveAnalysis.feasibility.verdict || 'Calibrated Pace'}
                  </span>
                  <strong style={{ fontSize: '1rem', fontFamily: 'JetBrains Mono' }}>
                    {liveAnalysis.feasibility.score}/100
                  </strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-inset)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>ESTIMATED LOAD</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-serif-title)', marginTop: '4px' }}>
                  ~{liveAnalysis.feasibility.estimatedDailyHours || 2.2} hrs / day &middot; ~{liveAnalysis.targets?.dailyTarget || 2} items / day
                </div>
              </div>

              {liveAnalysis.feasibility.pacingVerdict && (
                <div style={{ background: 'var(--bg-card-inset)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>COGNITIVE PACING</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.35' }}>
                    {liveAnalysis.feasibility.pacingVerdict}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4-Week Milestone Roadmap */}
          {liveAnalysis.weeklyMilestones && liveAnalysis.weeklyMilestones.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                <span>4-WEEK PROGRESSIVE MILESTONES:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {liveAnalysis.weeklyMilestones.map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card-inset)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--color-blue)' }}>
                      WEEK {w.week || idx + 1}: {w.target ? `${w.target} items` : ''}
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-serif-title)', marginTop: '2px' }}>
                      {w.theme}
                    </div>
                    {w.focus && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                        {w.focus}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tactical Recommendations preview */}
          {liveAnalysis.tacticalRecommendations && liveAnalysis.tacticalRecommendations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={13} />
                <span>Tactical Advice:</span>
              </span>
              {liveAnalysis.tacticalRecommendations.slice(0, 2).map((rec, idx) => (
                <span key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card-inset)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                  &bull; {rec}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== ACTIVE CATEGORY BREAKDOWN ==================== */}
      <section>
        <div className="rv-section-head">
          <div>
            <h2 className="font-serif">Category Breakdown</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Your active monthly curriculum stored in PostgreSQL. Progress updates dynamically as you solve problems and complete daily todos.
            </p>
          </div>
          <span className="mono-label">{targets.length} Categories</span>
        </div>

        {targets.length > 0 ? (
          <div className="rv-month">
            {targets.map((t, idx) => {
              const pct = Math.min(100, Math.round(((t.completedCount || 0) / Math.max(1, t.targetCount || 1)) * 100));
              const colorCycle = ['var(--color-blue)', 'var(--color-purple)', 'var(--color-green)', 'var(--color-amber)'];
              const grad = colorCycle[idx % colorCycle.length];
              const evalResult = rescheduleEvaluations[t.category];

              return (
                <div key={idx} className="rv-progline" style={{ marginBottom: '16px' }}>
                  <div className="top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="name" style={{ fontWeight: '700', fontSize: '0.92rem' }}>{t.category}</span>

                      {/* Gemini Rescheduling Advisor button & result */}
                      {evalResult ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: evalResult.decision === 'YES' ? 'var(--color-amber-subtle)' : 'var(--color-green-subtle)',
                            color: evalResult.decision === 'YES' ? 'var(--color-amber)' : 'var(--color-green)',
                            border: '1px solid',
                            borderColor: evalResult.decision === 'YES' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(5, 150, 105, 0.4)'
                          }}>
                            {evalResult.decision === 'YES' ? '⚠️ RESCHEDULE: YES' : '✓ RESCHEDULE: NO'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {evalResult.rationale}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAskGeminiRescheduling(t)}
                          className="btn-secondary"
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'var(--border-subtle)'
                          }}
                          title="Ask Gemini if this milestone should be rescheduled based on roadmap velocity"
                        >
                          <Sparkles size={11} color="var(--accent-cyan)" />
                          <span>Ask Gemini Rescheduling</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="val" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {t.completedCount || 0} / {t.targetCount} ({pct}%)
                      </span>
                      <button
                        onClick={() => handleDeleteTarget(t.category)}
                        title="Delete category"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="track" style={{ height: '7px', marginTop: '6px' }}>
                    <div className="fill" style={{ width: `${pct}%`, background: grad }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Target size={32} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: '600', color: 'var(--text-serif-title)', fontSize: '1.05rem', marginBottom: '6px' }}>
              No monthly study goals set yet
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 16px auto', lineHeight: '1.4' }}>
              Use the <strong>"Plan with Natural Language AI"</strong> button to describe your goals in plain English, or click <strong>"Add Custom Target"</strong> to configure your milestones manually.
            </p>
            <button
              onClick={() => setShowAiStudio(true)}
              className="btn-primary"
              style={{ fontSize: '0.84rem' }}
            >
              <Sparkles size={14} />
              <span>Launch Natural Language Planner</span>
            </button>
          </div>
        )}
      </section>

      {/* Manual Add Target Modal */}
      {showAddModal && (
        <Modal
          onClose={() => setShowAddModal(false)}
          icon={Target}
          title="Add Roadmap Category Target"
          maxWidth={460}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowAddModal(false)} style={{ fontSize: '0.82rem' }}>
                Cancel
              </Button>
              <Button type="submit" form="add-target-form" variant="primary" icon={Save} style={{ fontSize: '0.82rem' }}>
                Save Target
              </Button>
            </>
          }
        >
          <form id="add-target-form" onSubmit={handleAddManualTarget} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
                Roadmap Track Category
              </label>
              <select
                className="form-input"
                value={selectedPresetCat}
                onChange={(e) => setSelectedPresetCat(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem' }}
              >
                {ROADMAP_CATEGORIES.map(rc => (
                  <option key={rc.id} value={rc.id}>
                    {rc.label}
                  </option>
                ))}
                <option value="__custom__">+ Add Custom Category...</option>
              </select>
            </div>

            {selectedPresetCat === '__custom__' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
                  Custom Category Name
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Mock Interviews or Low-Level Design"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
                Target Count (Problems / Milestones)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                className="form-input"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
