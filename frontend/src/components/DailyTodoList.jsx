import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  RotateCcw,
  PlusCircle,
  X,
  Layers,
  CheckSquare,
  Square,
  Wand2,
  Calendar,
  RefreshCw,
  ArrowRight,
  Tag,
  Filter,
  Coffee
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Modal, Button } from './ui';

// Subtask Category Detection Helper
function detectSubtaskCategory(title, parentCategory = 'DSA') {
  const lower = (title || '').toLowerCase();
  if (lower.includes('warmup') || lower.includes('skip') || lower.includes('jump') || lower.includes('stretch') || lower.includes('mobility') || lower.includes('hydration') || lower.includes('gym')) {
    return 'Warmup';
  }
  if (lower.includes('code') || lower.includes('implement') || lower.includes('logic') || lower.includes('java') || lower.includes('solve') || lower.includes('leetcode') || lower.includes('invariant')) {
    return 'Code';
  }
  if (lower.includes('review') || lower.includes('test') || lower.includes('verify') || lower.includes('edge case') || lower.includes('srs') || lower.includes('recall')) {
    return 'Review';
  }
  if (lower.includes('read') || lower.includes('theory') || lower.includes('notes') || lower.includes('dbms') || lower.includes('os') || lower.includes('acid') || lower.includes('lecture')) {
    return 'Theory';
  }
  if (parentCategory === 'Habit') return 'Warmup';
  if (parentCategory === 'DBMS' || parentCategory === 'OS') return 'Theory';
  return 'Code';
}

function getSubtaskBadgeStyle(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'code':
      return { background: 'var(--color-blue-subtle)', color: 'var(--color-blue)', border: '1px solid rgba(14,165,164,0.2)' };
    case 'review':
      return { background: 'var(--color-green-subtle)', color: 'var(--color-green)', border: '1px solid rgba(5, 150, 105, 0.2)' };
    case 'warmup':
      return { background: 'var(--color-amber-subtle)', color: 'var(--color-amber)', border: '1px solid rgba(217, 119, 6, 0.2)' };
    case 'theory':
      return { background: 'var(--color-purple-subtle)', color: 'var(--color-purple)', border: '1px solid rgba(124, 58, 237, 0.2)' };
    default:
      return { background: 'var(--bg-card-inset)', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)' };
  }
}

// Intelligent natural-language parser for tasks, habits and sub-ticks
function parseTaskInput(input, chosenCategory, chosenCount = 0) {
  const clean = input.trim();
  let parentTitle = clean;
  let category = chosenCategory || 'DSA';
  let isHabit = category === 'Habit';
  let subtasks = [];

  // 1. Check for hierarchy syntax like "gym -> skipping ropes and stimuler" or "Workout : Skipping rope"
  if (clean.includes('->') || clean.includes('=>') || clean.includes(':')) {
    const delimiter = clean.includes('->') ? '->' : (clean.includes('=>') ? '=>' : ':');
    const firstSplitIndex = clean.indexOf(delimiter);
    const parentPart = clean.substring(0, firstSplitIndex).trim();
    const restPart = clean.substring(firstSplitIndex + delimiter.length).trim();

    parentTitle = parentPart.length > 0 ? parentPart : 'Daily Routine';
    const lowerParent = parentTitle.toLowerCase();

    if (lowerParent.includes('morning') || lowerParent.includes('habit') || lowerParent.includes('routine') || lowerParent.includes('gym') || lowerParent.includes('workout')) {
      isHabit = true;
      category = 'Habit';
    }

    // Split restPart by '->', '=>', ',', ' and ', ' & ', ' + '
    const compoundItems = restPart
      .split(/->|=>|,|\band\b|&|\+/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (compoundItems.length > 0) {
      compoundItems.forEach((rawItem, idx) => {
        const itemLower = rawItem.toLowerCase();
        let itemTitle = rawItem;
        let itemCat = detectSubtaskCategory(rawItem, category);

        // Enhance skipping ropes
        if (itemLower.includes('skip') || itemLower.includes('rope') || itemLower.includes('jump')) {
          const skipMatch = itemLower.match(/(\d+)/);
          const count = skipMatch ? parseInt(skipMatch[1], 10) : 1500;
          itemTitle = `Skipping Ropes (${count} jumps)`;
          itemCat = 'Warmup';
        } else if (itemLower.includes('stimuler') || itemLower.includes('speech')) {
          itemTitle = `Stimuler: English & speech practice drill`;
          itemCat = 'Review';
        } else if (itemLower.includes('read') || itemLower.includes('book')) {
          itemTitle = `Technical reading: 25 min core concept`;
          itemCat = 'Theory';
        } else if (itemLower.includes('gym') || itemLower.includes('weight')) {
          itemTitle = `Gym session & core bodyweight workout`;
          itemCat = 'Warmup';
        }

        subtasks.push({
          id: `st-${Date.now()}-${idx + 1}`,
          title: itemTitle,
          category: itemCat,
          completed: false
        });
      });

      return { parentTitle, category, isHabit, subtasks };
    }
  }

  const lower = clean.toLowerCase();

  // If user selected explicit count > 0
  if (chosenCount > 0) {
    for (let i = 1; i <= chosenCount; i++) {
      subtasks.push({
        id: `st-${Date.now()}-${i}`,
        title: `Part ${i} / ${chosenCount} (${clean})`,
        category: category === 'Habit' ? 'Warmup' : 'Code',
        completed: false
      });
    }
    return { parentTitle, category, isHabit, subtasks };
  }

  // Auto-parse skipping rope numbers (e.g. "1500 skipping rope" or "1000 skips")
  const skipMatch = lower.match(/(\d+)\s*(skips|skipping|jumps|rope)/);
  if (skipMatch || lower.includes('skipping') || lower.includes('jump rope')) {
    isHabit = true;
    category = 'Habit';
    const total = skipMatch ? parseInt(skipMatch[1], 10) : 1500;
    const split = Math.max(100, Math.floor(total / 3));
    subtasks = [
      { id: `st-${Date.now()}-1`, title: `${split} jumps (Warmup round)`, category: 'Warmup', completed: false },
      { id: `st-${Date.now()}-2`, title: `${split} jumps (High tempo set)`, category: 'Warmup', completed: false },
      { id: `st-${Date.now()}-3`, title: `${total - (split * 2)} jumps (Finisher set)`, category: 'Warmup', completed: false }
    ];
    return { parentTitle, category, isHabit, subtasks };
  }

  // Auto-parse "X problems" (e.g. "3 problems" or "2 LeetCode questions")
  const probMatch = lower.match(/(\d+)\s*(problems|questions|tasks|leetcode)/);
  if (probMatch) {
    const total = Math.min(6, parseInt(probMatch[1], 10));
    for (let i = 1; i <= total; i++) {
      subtasks.push({
        id: `st-${Date.now()}-${i}`,
        title: `Problem #${i} implementation & tests in Java`,
        category: 'Code',
        completed: false
      });
    }
    return { parentTitle, category: 'DSA', isHabit: false, subtasks };
  }

  // 2. If habit without explicit count
  if (category === 'Habit' || lower.includes('morning') || lower.includes('routine') || lower.includes('gym') || lower.includes('workout')) {
    isHabit = true;
    category = 'Habit';
    subtasks = [
      { id: `st-${Date.now()}-1`, title: `Warmup & joint mobility (5 min)`, category: 'Warmup', completed: false },
      { id: `st-${Date.now()}-2`, title: `Core routine execution (${clean})`, category: 'Warmup', completed: false },
      { id: `st-${Date.now()}-3`, title: `Cooldown stretches & log streak`, category: 'Review', completed: false }
    ];
    return { parentTitle, category, isHabit, subtasks };
  }

  // 3. For DSA / Coding problems
  if (category === 'DSA' || lower.includes('sum') || lower.includes('tree') || lower.includes('graph') || lower.includes('array') || lower.includes('window') || lower.includes('dp') || lower.includes('pointer')) {
    subtasks = [
      { id: `st-${Date.now()}-1`, title: `Analyze constraints & define invariant logic`, category: 'Code', completed: false },
      { id: `st-${Date.now()}-2`, title: `Code optimal Java solution (${clean})`, category: 'Code', completed: false },
      { id: `st-${Date.now()}-3`, title: `Trace edge cases (empty, duplicates, overflow)`, category: 'Review', completed: false }
    ];
    return { parentTitle, category: 'DSA', isHabit: false, subtasks };
  }

  // 4. For Core Theory (DBMS / OS / Networks)
  if (category === 'DBMS' || category === 'OS' || lower.includes('dbms') || lower.includes('acid') || lower.includes('paging') || lower.includes('transaction') || lower.includes('thread') || lower.includes('deadlock')) {
    subtasks = [
      { id: `st-${Date.now()}-1`, title: `Study core architecture & diagrams for ${clean}`, category: 'Theory', completed: false },
      { id: `st-${Date.now()}-2`, title: `Trace real-world execution & failure modes`, category: 'Theory', completed: false },
      { id: `st-${Date.now()}-3`, title: `Draft 2-sentence active recall summary notes`, category: 'Review', completed: false }
    ];
    return { parentTitle, category: category || 'DBMS', isHabit: false, subtasks };
  }

  // 5. Default contextual dynamic subtasks for ANY other task
  subtasks = [
    { id: `st-${Date.now()}-1`, title: `Phase 1: Setup & outline objectives`, category: 'Theory', completed: false },
    { id: `st-${Date.now()}-2`, title: `Phase 2: Core execution & implementation`, category: 'Code', completed: false },
    { id: `st-${Date.now()}-3`, title: `Phase 3: Verify results & log completion`, category: 'Review', completed: false }
  ];

  return { parentTitle, category, isHabit, subtasks };
}

// Maps one AI/fallback plan task (from /chat/plan-daily) into a Daily Todo DTO.
// Kept module-level so both the silent auto-generator and the manual fallback
// button share exactly one mapping. Subtasks come from the plan when present,
// otherwise they're derived locally so every task still gets meaningful sub-ticks.
function mapPlanTaskToDto(t, dateKey) {
  const titleLower = (t.title || '').toLowerCase();
  const isHabit = t.category === 'habit' || t.taskType === 'streak' ||
    titleLower.includes('rope') || titleLower.includes('gym');

  let boxColor = 'box-blue';
  if (isHabit) boxColor = 'box-amber';
  else if (t.category === 'os_dbms' || t.category === 'recap') boxColor = 'box-purple';
  else if (t.category === 'revision') boxColor = 'box-green';

  let subtasks = [];
  if (t.subtasks && Array.isArray(t.subtasks) && t.subtasks.length > 0) {
    subtasks = t.subtasks.map((st, sidx) => ({
      title: st.title || st.name || `Subtask ${sidx + 1}`,
      category: detectSubtaskCategory(st.title || st.name, isHabit ? 'Habit' : 'DSA')
    }));
  } else {
    const auto = parseTaskInput((t.title || '') + ' ' + (t.description || ''), isHabit ? 'Habit' : 'DSA');
    subtasks = (auto.subtasks || []).map(st => ({ title: st.title, category: st.category }));
  }

  return {
    title: t.title,
    category: isHabit ? 'Habit' : (t.category === 'os_dbms' ? 'DBMS' : (t.category || 'DSA')),
    isHabit,
    estimatedMinutes: t.estimatedMinutes || 30,
    colorClass: boxColor,
    date: dateKey,
    subtasks
  };
}

const CURATED_ITEMS = [
  {
    id: 'cq-1',
    title: 'Morning Routine: Skipping Rope 1500x',
    category: 'Habit',
    isHabit: true,
    estimatedMinutes: 20,
    colorClass: 'box-amber',
    subtasks: [
      { id: 'st-1', title: '500 jumps warmup round', category: 'Warmup', completed: true },
      { id: 'st-2', title: '500 jumps high-knees tempo set', category: 'Warmup', completed: false },
      { id: 'st-3', title: '500 jumps cooldown & stretches', category: 'Warmup', completed: false }
    ]
  },
  {
    id: 'cq-2',
    title: 'Two Sum (HashMap O(N) Invariant)',
    category: 'DSA',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    estimatedMinutes: 20,
    colorClass: 'box-blue',
    subtasks: [
      { id: 'st-4', title: 'Code complement lookup logic in Java', category: 'Code', completed: false },
      { id: 'st-5', title: 'Verify duplicate edge cases with O(N) runtime', category: 'Review', completed: false }
    ]
  },
  {
    id: 'cq-3',
    title: 'DBMS: Transaction Isolation Levels',
    category: 'DBMS',
    difficulty: 'Medium',
    topic: 'Transactions',
    estimatedMinutes: 25,
    colorClass: 'box-purple',
    subtasks: [
      { id: 'st-6', title: 'Read Read Committed vs Repeatable Read vs Serializable', category: 'Theory', completed: false },
      { id: 'st-7', title: 'Write 2-sentence summary on Phantom Reads in notes', category: 'Review', completed: false }
    ]
  },
  {
    id: 'cq-4',
    title: '15-Minute Flashcards Recall',
    category: 'Habit',
    isHabit: true,
    estimatedMinutes: 15,
    colorClass: 'box-amber',
    subtasks: [
      { id: 'st-8', title: 'Review 5 DBMS ACID cards', category: 'Theory', completed: false },
      { id: 'st-9', title: 'Review 5 OS Concurrency cards', category: 'Theory', completed: false }
    ]
  }
];

export default function DailyTodoList({ onStartReview, onNavigateToChat, onNavigateToLibrary }) {
  const todayKey = new Date().toISOString().split('T')[0];

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('DSA');
  const [customCategory, setCustomCategory] = useState('');
  const [currentDateKey, setCurrentDateKey] = useState(todayKey);
  const [newEstMinutes, setNewEstMinutes] = useState(30);
  const [newSubtaskCount, setNewSubtaskCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showCurated, setShowCurated] = useState(false);

  // Subtask addition state
  const [addingSubtaskId, setAddingSubtaskId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskCategory, setNewSubtaskCategory] = useState('Auto');
  const [loadingAiId, setLoadingAiId] = useState(null);

  // Automatic daily-plan generation. There is deliberately no always-visible
  // "generate" button — today's plan builds itself silently when the day is
  // empty (and not an off-day). `autoGenerating` shows a subtle progress pill
  // while that happens; `planLoadFailed` flips true only if auto-generation
  // could not populate the day, which is the sole case that reveals the manual
  // "Load today's plan" fallback button.
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [planLoadFailed, setPlanLoadFailed] = useState(false);
  const autoGenAttemptedRef = useRef({});

  // Off Day status for today
  const [isOffDay, setIsOffDay] = useState(() => {
    try {
      return localStorage.getItem(`reviser_off_day_${todayKey}`) === 'true';
    } catch (_) {
      return false;
    }
  });

  const handleToggleOffDay = () => {
    const nextVal = !isOffDay;
    setIsOffDay(nextVal);
    try {
      if (nextVal) {
        localStorage.setItem(`reviser_off_day_${todayKey}`, 'true');
      } else {
        localStorage.removeItem(`reviser_off_day_${todayKey}`);
      }
    } catch (_) { }
  };

  // Reads the persisted off-day flag for a given date straight from storage so
  // the auto-generator never relies on possibly-stale React state.
  const isOffDayFor = (dateKey) => {
    try {
      return localStorage.getItem(`reviser_off_day_${dateKey}`) === 'true';
    } catch (_) {
      return false;
    }
  };

  // Core generator shared by the silent path and the manual fallback button.
  // An empty prompt routes the backend to the master daily plan (which always
  // returns a deterministic fallback even with no Gemini key), so this reliably
  // fills the day. `replaceTodos` is delete-then-insert, so callers must only
  // invoke this for a genuinely empty day.
  const generatePlan = async (dateToLoad, { silent } = { silent: true }) => {
    setAutoGenerating(true);
    try {
      const res = await api.planDailyWithAi('');
      if (res && Array.isArray(res.tasks) && res.tasks.length > 0) {
        const dtos = res.tasks.map((t) => mapPlanTaskToDto(t, dateToLoad));
        const savedList = await api.replaceTodos(dateToLoad, dtos);
        setTodos(savedList || []);
        setPlanLoadFailed(false);
        if (!silent && savedList && savedList.length > 0) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
        return true;
      }
      setPlanLoadFailed(true);
      return false;
    } catch (err) {
      console.error('Daily plan generation failed:', err);
      setPlanLoadFailed(true);
      return false;
    } finally {
      setAutoGenerating(false);
    }
  };

  // Silent, automatic path — runs at most once per date so a background retry
  // or React strict-mode double-invoke can't double-insert the plan.
  const runAutoGen = (dateToLoad) => {
    if (autoGenAttemptedRef.current[dateToLoad]) return;
    autoGenAttemptedRef.current[dateToLoad] = true;
    generatePlan(dateToLoad, { silent: true });
  };

  // Manual "start fresh" for TODAY only. Wipes today's tasks (including any
  // completed ones) and regenerates the built-in daily routine on demand.
  // Never touches past days — the whole point is a clean rebuild of today.
  const handleRebuildToday = async () => {
    if (!window.confirm("Rebuild today's plan? This clears today's tasks (including completed ones) and generates a fresh plan.")) {
      return;
    }
    autoGenAttemptedRef.current[todayKey] = true; // keep the empty-day auto-gen from racing this
    await generatePlan(todayKey, { silent: false });
  };

  // Load from database
  const loadTodos = async (dateToLoad = currentDateKey) => {
    setLoading(true);
    let data = [];
    try {
      data = await api.getTodos(dateToLoad);
      setTodos(data || []);
    } catch (err) {
      console.error('Error loading todos from database:', err);
      setTodos([]);
    } finally {
      setLoading(false);
    }

    // Auto-build today's plan silently when the day is empty and not an off-day.
    // Only ever for the real "today" — past/other dates are never auto-filled.
    if ((!data || data.length === 0) && dateToLoad === todayKey && !isOffDayFor(dateToLoad)) {
      runAutoGen(dateToLoad);
    }
  };

  useEffect(() => {
    loadTodos(currentDateKey);

    // Automatically check for 12:00 AM midnight date rollover without requiring manual clicks
    const midnightInterval = setInterval(() => {
      const nowKey = new Date().toISOString().split('T')[0];
      if (nowKey !== currentDateKey) {
        setCurrentDateKey(nowKey);
        loadTodos(nowKey);
      }
    }, 15000);

    return () => clearInterval(midnightInterval);
  }, [currentDateKey]);

  // Main task toggle (persisted to DB)
  const handleToggle = async (id) => {
    try {
      const updated = await api.toggleTodo(id);
      setTodos(prev => prev.map(todo => (todo.id === id ? updated : todo)));

      if (updated.completed) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#0ea5a4', '#059669', '#d97706', '#7c3aed']
        });
      }
      // Let the dashboard (mounted but hidden) refresh its streak live.
      window.dispatchEvent(new CustomEvent('reviser:todos-changed'));
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  // Subtask toggle (persisted to DB)
  const handleSubtaskToggle = async (taskId, subtaskId) => {
    try {
      const updated = await api.toggleSubtask(taskId, subtaskId);
      setTodos(prev => prev.map(todo => (todo.id === taskId ? updated : todo)));

      if (updated.completed) {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#0ea5a4', '#059669', '#d97706', '#7c3aed']
        });
      }
      // Let the dashboard (mounted but hidden) refresh its streak live.
      window.dispatchEvent(new CustomEvent('reviser:todos-changed'));
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  // Add subtask manually with category (persisted to DB)
  const handleAddSubtask = async (taskId, parentCat) => {
    if (!newSubtaskTitle.trim()) return;

    const cat = newSubtaskCategory === 'Auto'
      ? detectSubtaskCategory(newSubtaskTitle, parentCat)
      : newSubtaskCategory;

    try {
      const updated = await api.addSubtask(taskId, {
        title: newSubtaskTitle.trim(),
        category: cat
      });
      setTodos(prev => prev.map(todo => (todo.id === taskId ? updated : todo)));
      setNewSubtaskTitle('');
      setNewSubtaskCategory('Auto');
      setAddingSubtaskId(null);
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  // Delete subtask (persisted to DB)
  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const updated = await api.deleteSubtask(taskId, subtaskId);
      setTodos(prev => prev.map(todo => (todo.id === taskId ? updated : todo)));
    } catch (err) {
      console.error('Error deleting subtask:', err);
    }
  };

  // Add Task with dynamic sub-ticks & NLP hierarchy (Automatic AI generation, persisted to DB)
  const handleAddTask = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;

    const inputTitle = newTitle.trim();
    const finalCat = newCategory === '__custom__' ? (customCategory.trim() || 'Custom') : newCategory;
    const parsed = parseTaskInput(inputTitle, finalCat, Number(newSubtaskCount));
    parsed.category = finalCat;

    let boxColor = 'box-blue';
    if (parsed.isHabit || finalCat === 'Habit') boxColor = 'box-amber';
    else if (finalCat === 'Core CS' || finalCat === 'DBMS' || finalCat === 'OS') boxColor = 'box-purple';
    else if (finalCat === 'Workers Den') boxColor = 'box-cyan';
    else if (finalCat === 'Spring Boot Drill') boxColor = 'box-green';
    else if (finalCat === 'Applications / Referrals') boxColor = 'box-amber';
    else if (finalCat === 'Open Source') boxColor = 'box-blue';

    let subtasksPayload = (parsed.subtasks || []).map(st => ({
      title: st.title,
      category: st.category || 'Code'
    }));

    // Subtasks are optional: only attach the ones the user explicitly typed.
    // Tasks added without subtasks stay flat — no forced AI breakdown.

    try {
      const created = await api.createTodo({
        title: parsed.parentTitle,
        category: parsed.category,
        isHabit: parsed.isHabit,
        estimatedMinutes: Number(newEstMinutes) || 30,
        colorClass: boxColor,
        date: currentDateKey,
        subtasks: subtasksPayload
      });
      setTodos(prev => [created, ...prev]);
      setNewTitle('');
      setCustomCategory('');
      setNewSubtaskCount(0);
    } catch (err) {
      console.error('Failed to create task in DB:', err);
    }
  };

  const handleAddCurated = async (item) => {
    const exists = todos.some(t => t.title.toLowerCase().includes(item.title.toLowerCase()));
    if (exists) {
      alert('This item is already in your daily list!');
      return;
    }

    try {
      const created = await api.createTodo({
        title: item.title,
        category: item.category,
        isHabit: item.isHabit || item.category === 'Habit',
        estimatedMinutes: item.estimatedMinutes || 20,
        colorClass: item.colorClass || 'box-blue',
        date: todayKey,
        subtasks: (item.subtasks || []).map(st => ({
          title: st.title,
          category: st.category || 'Code'
        }))
      });
      setTodos(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to add curated task:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const allSubtasks = todos.flatMap(t => t.subtasks || []);
  const completedSubtasks = allSubtasks.filter(st => st.completed).length;

  // Subtask category breakdown counts
  const subCatCounts = {
    Code: allSubtasks.filter(st => (st.category || '').toLowerCase() === 'code').length,
    Warmup: allSubtasks.filter(st => (st.category || '').toLowerCase() === 'warmup').length,
    Theory: allSubtasks.filter(st => (st.category || '').toLowerCase() === 'theory').length,
    Review: allSubtasks.filter(st => (st.category || '').toLowerCase() === 'review').length
  };

  const filteredTodos = todos.filter(t => {
    if (activeFilter === 'PENDING') return !t.completed;
    if (activeFilter === 'COMPLETED') return t.completed;
    if (activeFilter === 'ALL') return true;
    return (t.category || '').toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ==================== AI GENERATOR ACTION BAR ==================== */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-blue)" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
              Daily Action &amp; Habit Subtasks
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(52, 199, 89, 0.08)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--color-green)',
              fontFamily: 'JetBrains Mono',
              fontWeight: '600'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-green)', display: 'inline-block', boxShadow: '0 0 6px var(--color-green)' }}></span>
              <span>Auto-rolls at 12:00 AM Midnight</span>
            </div>

            {/* Silent auto-generation progress — shown instead of any button */}
            {autoGenerating && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--color-blue-subtle)',
                border: '1px solid rgba(14,165,164,0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--color-blue)',
                fontFamily: 'JetBrains Mono',
                fontWeight: '600'
              }}>
                <RefreshCw size={13} className="animate-spin" />
                <span>Preparing today's plan…</span>
              </div>
            )}

            {/* Manual fallback — appears ONLY when today's plan didn't load
                automatically (empty day, not an off-day, nothing generating). */}
            {!autoGenerating && !loading && !isOffDay && todos.length === 0 && (
              <button
                onClick={() => generatePlan(currentDateKey, { silent: false })}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                title="Today's plan didn't load on its own — build it now"
              >
                <Wand2 size={14} />
                <span>Load today's plan</span>
              </button>
            )}

            {/* Manual "start fresh" — visible whenever today already has a plan,
                so the user can regenerate a clean built-in routine on demand.
                Today only; past days are never rebuilt. */}
            {!autoGenerating && !loading && !isOffDay && currentDateKey === todayKey && todos.length > 0 && (
              <button
                onClick={handleRebuildToday}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                title="Clear today's tasks and generate a fresh daily plan"
              >
                <RefreshCw size={14} />
                <span>Rebuild today's plan</span>
              </button>
            )}

            <button
              onClick={handleToggleOffDay}
              style={{
                background: isOffDay ? '#FFEDB9' : 'var(--bg-card-inset)',
                border: isOffDay ? '1.5px solid #d4b35f' : '1px solid var(--border-subtle)',
                color: isOffDay ? '#784d02' : 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: isOffDay ? '700' : '500',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              title={isOffDay ? 'Resume study schedule' : 'Take today off for rest & cognitive recovery'}
            >
              <Coffee size={13} color={isOffDay ? '#784d02' : 'var(--color-amber)'} />
              <span>{isOffDay ? 'Off Day Active (Resume)' : 'Take Day Off'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Subtask Category Metric Badges */}
        {allSubtasks.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            fontSize: '0.74rem',
            fontFamily: 'JetBrains Mono'
          }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>SUBTASK BREAKDOWN:</span>
            {subCatCounts.Code > 0 && (
              <span style={{ ...getSubtaskBadgeStyle('code'), padding: '2px 8px', borderRadius: '3px', fontWeight: '700' }}>
                ■ {subCatCounts.Code} Code / Drill
              </span>
            )}
            {subCatCounts.Warmup > 0 && (
              <span style={{ ...getSubtaskBadgeStyle('warmup'), padding: '2px 8px', borderRadius: '3px', fontWeight: '700' }}>
                ■ {subCatCounts.Warmup} Warmup / Habit
              </span>
            )}
            {subCatCounts.Theory > 0 && (
              <span style={{ ...getSubtaskBadgeStyle('theory'), padding: '2px 8px', borderRadius: '3px', fontWeight: '700' }}>
                ■ {subCatCounts.Theory} Theory / Notes
              </span>
            )}
            {subCatCounts.Review > 0 && (
              <span style={{ ...getSubtaskBadgeStyle('review'), padding: '2px 8px', borderRadius: '3px', fontWeight: '700' }}>
                ■ {subCatCounts.Review} Review / Tests
              </span>
            )}
          </div>
        )}
      </div>

      {/* ==================== ACTIVE OFF DAY REST BANNER ==================== */}
      {isOffDay && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,237,185,0.45) 0%, var(--bg-card) 100%)',
          border: '1.5px solid #ebd7a3',
          borderRadius: 'var(--radius-md)',
          padding: '22px 26px',
          boxShadow: '0 2px 10px rgba(120, 77, 2, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#FFEDB9',
              border: '1px solid #d4b35f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🏖️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#784d02', margin: 0 }}>
                  Today is Your Off Day
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  fontFamily: 'JetBrains Mono',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: '#FFEDB9',
                  color: '#784d02',
                  border: '1px solid #d4b35f'
                }}>
                  REST &amp; RECOVERY
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Rest and mental disengagement are critical to consolidate learning and prevent burnout. Your SM-2 retention curves and streaks are protected.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleOffDay}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 14px', whiteSpace: 'nowrap' }}
          >
            Resume Study Day
          </button>
        </div>
      )}

      {/* ==================== MAIN CHECKLIST & CREATION ==================== */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        {/* Top Status & Filter Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-serif" style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-serif-title)' }}>
                Today's Modules &amp; Sub-ticks
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.72rem',
                color: 'var(--color-green)',
                background: 'var(--color-green-subtle)',
                padding: '2px 6px',
                borderRadius: '2px',
                fontWeight: '700'
              }}>
                {completedCount}/{totalCount} ({progressPercent}%)
              </span>
              {allSubtasks.length > 0 && (
                <span style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.72rem',
                  color: 'var(--color-blue)',
                  background: 'var(--color-blue-subtle)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  fontWeight: '700'
                }}>
                  {completedSubtasks}/{allSubtasks.length} ticks
                </span>
              )}
            </div>
            <div style={{ width: '200px', height: '4px', background: 'var(--bg-card-inset)', borderRadius: '1px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--color-green)', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'COMPLETED', 'DSA', 'Core CS', 'Workers Den', 'Spring Boot Drill', 'Applications / Referrals', 'Open Source'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  border: '1px solid',
                  borderColor: activeFilter === f ? 'var(--color-blue)' : 'var(--border-main)',
                  background: activeFilter === f ? 'var(--primary-light)' : 'transparent',
                  color: activeFilter === f ? 'var(--color-blue)' : 'var(--text-muted)',
                  fontWeight: activeFilter === f ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Add Form Bar with NLP and Sub-tick Stepper */}
        <form
          onSubmit={handleAddTask}
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-hover)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <input
            type="text"
            placeholder="Type task or hierarchy (e.g. 'Morning task -> skipping ropes 1500', 'Solve 3 problems', 'DBMS Paging')..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '240px', padding: '6px 10px', fontSize: '0.84rem' }}
          />

          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="form-input"
            style={{ width: '150px', padding: '6px 8px', fontSize: '0.8rem' }}
          >
            <option value="DSA">DSA</option>
            <option value="Core CS">Core CS</option>
            <option value="Workers Den">Workers Den</option>
            <option value="Spring Boot Drill">Spring Boot Drill</option>
            <option value="Applications / Referrals">Applications / Referrals</option>
            <option value="Open Source">Open Source</option>
            <option value="__custom__">+ Custom Category</option>
          </select>

          {newCategory === '__custom__' && (
            <input
              type="text"
              placeholder="Custom category..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="form-input"
              style={{ width: '150px', padding: '6px 8px', fontSize: '0.8rem' }}
              required
            />
          )}

          {/* Sub-tick Count Stepper */}
          <select
            value={newSubtaskCount}
            onChange={(e) => setNewSubtaskCount(Number(e.target.value))}
            className="form-input"
            style={{ width: '125px', padding: '6px 8px', fontSize: '0.8rem' }}
            title="Auto-generate dynamic sub-ticks"
          >
            <option value={0}>Auto sub-ticks</option>
            <option value={2}>2 Sub-ticks</option>
            <option value={3}>3 Sub-ticks</option>
            <option value={4}>4 Sub-ticks</option>
            <option value={5}>5 Sub-ticks</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </form>

        {/* Task Items List with Solid Boxy Left Borders */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={16} className="animate-spin" />
              <span>Loading schedule from database...</span>
            </div>
          ) : autoGenerating && todos.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={16} className="animate-spin" />
              <span>Preparing today's plan automatically…</span>
            </div>
          ) : todos.length === 0 && !isOffDay ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span>{planLoadFailed ? "Today's plan couldn't load automatically." : "No plan loaded for today yet."}</span>
              <button
                onClick={() => generatePlan(currentDateKey, { silent: false })}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <Wand2 size={14} />
                <span>Load today's plan</span>
              </button>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No tasks match this filter. Add one above!
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const isDone = todo.completed;
              const subtasks = todo.subtasks || [];
              const hasSubtasks = subtasks.length > 0;
              const subDoneCount = subtasks.filter(st => st.completed).length;
              const isAiLoading = loadingAiId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={todo.colorClass || 'box-blue'}
                  style={{
                    padding: '12px 18px',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: 'none',
                    borderRight: 'none',
                    background: isDone ? 'rgba(0, 0, 0, 0.02)' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* Row 1: Checkbox + Title + Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Square Boxy Checkbox */}
                    <button
                      onClick={() => handleToggle(todo.id)}
                      role="checkbox"
                      aria-checked={isDone}
                      aria-label={`Mark "${todo.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '2px',
                        border: isDone ? 'none' : '1.5px solid var(--border-hover)',
                        background: isDone ? 'var(--color-green)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isDone && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: isDone ? '500' : '700',
                        color: isDone ? 'var(--text-dim)' : 'var(--text-serif-title)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{todo.title}</span>
                        {todo.isHabit && (
                          <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                            <Flame size={10} /> Habit
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '2px'
                      }}>
                        <span className="mono-label">{todo.category}</span>
                        <span>·</span>
                        <span>{todo.estimatedMinutes || 30}m</span>
                        {hasSubtasks && (
                          <>
                            <span>·</span>
                            <span style={{ color: subDoneCount === subtasks.length ? 'var(--color-green)' : 'var(--text-muted)' }}>
                              {subDoneCount}/{subtasks.length} sub-ticks
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setAddingSubtaskId(addingSubtaskId === todo.id ? null : todo.id)}
                        className="btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                        title="Add custom sub-tick manually"
                        aria-label={`Add sub-tick to ${todo.title}`}
                      >
                        + Sub-tick
                      </button>

                      {todo.isReview && (
                        <button
                          onClick={() => onStartReview && onStartReview(todo)}
                          className="rv-review-btn"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          aria-label={`Start spaced review for ${todo.title}`}
                        >
                          Review
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                        aria-label={`Delete task ${todo.title}`}
                        title="Delete task"
                      >
                        <Trash2 size={13} color="var(--text-dim)" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-ticks List with Square Tick Boxes & Dynamic Colorful Green Progress Bar */}
                  {hasSubtasks && (
                    <div style={{
                      marginLeft: '30px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      paddingLeft: '12px',
                      borderLeft: '2px solid var(--border-subtle)',
                      marginTop: '6px'
                    }}>
                      {/* Dynamic Colorful Green Progress Bar for Subtasks */}
                      <div
                        role="progressbar"
                        aria-valuenow={Math.round((subDoneCount / subtasks.length) * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Subtask completion for ${todo.title}: ${subDoneCount} of ${subtasks.length}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '5px 10px',
                          background: subDoneCount === subtasks.length
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(14, 165, 164, 0.06)',
                          border: `1px solid ${subDoneCount === subtasks.length ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '4px'
                        }}
                      >
                        <div style={{
                          flex: 1,
                          height: '7px',
                          background: 'var(--border-main)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(subDoneCount / subtasks.length) * 100}%`,
                            height: '100%',
                            background: subDoneCount === subtasks.length
                              ? 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%)'
                              : 'linear-gradient(90deg, #0ea5a4 0%, #10b981 100%)',
                            boxShadow: subDoneCount > 0 ? '0 0 10px rgba(16, 185, 129, 0.45)' : 'none',
                            borderRadius: '4px',
                            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: subDoneCount === subtasks.length ? 'var(--color-green)' : 'var(--text-dim)',
                          whiteSpace: 'nowrap'
                        }}>
                          {subDoneCount}/{subtasks.length} ({Math.round((subDoneCount / subtasks.length) * 100)}%)
                        </span>
                      </div>

                      {subtasks.map((st) => {
                        const subCat = st.category || detectSubtaskCategory(st.title, todo.category);
                        const badgeStyle = getSubtaskBadgeStyle(subCat);

                        return (
                          <div
                            key={st.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '2px 0'
                            }}
                          >
                            <button
                              onClick={() => handleSubtaskToggle(todo.id, st.id)}
                              role="checkbox"
                              aria-checked={st.completed}
                              aria-label={`Subtask: ${st.title} (${st.completed ? 'completed' : 'pending'})`}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                border: st.completed ? 'none' : '1.5px solid var(--border-hover)',
                                background: st.completed ? 'var(--color-green)' : 'transparent',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: 0,
                                margin: 0,
                                transition: 'all 0.15s ease'
                              }}
                              title={st.completed ? 'Mark sub-tick incomplete' : 'Mark sub-tick complete'}
                            >
                              {st.completed && <Check size={11} color="#ffffff" strokeWidth={3.5} style={{ display: 'block' }} />}
                            </button>

                            {/* Subtask Category Badge */}
                            <span style={{
                              fontSize: '0.64rem',
                              fontFamily: 'JetBrains Mono',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase',
                              ...badgeStyle
                            }}>
                              {subCat}
                            </span>

                            <span style={{
                              fontSize: '0.8rem',
                              color: st.completed ? 'var(--text-dim)' : 'var(--text-main)',
                              textDecoration: st.completed ? 'line-through' : 'none',
                              flex: 1
                            }}>
                              {st.title}
                            </span>

                            <button
                              onClick={() => handleDeleteSubtask(todo.id, st.id)}
                              className="btn-icon"
                              style={{ width: '18px', height: '18px', border: 'none', background: 'transparent', opacity: 0.5, cursor: 'pointer', padding: 0 }}
                              title="Delete sub-tick"
                            >
                              <X size={11} color="var(--text-dim)" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Subtask Input Form with Category Selector */}
                  {addingSubtaskId === todo.id && (
                    <div style={{ marginLeft: '30px', display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Sub-tick name (e.g. '500 skips', 'Trace invariant in Java')..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        className="form-input"
                        style={{ padding: '3px 8px', fontSize: '0.78rem', width: '220px' }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(todo.id, todo.category);
                          }
                        }}
                      />

                      {/* Subtask Category Selector */}
                      <select
                        value={newSubtaskCategory}
                        onChange={(e) => setNewSubtaskCategory(e.target.value)}
                        className="form-input"
                        style={{ padding: '3px 6px', fontSize: '0.74rem', width: '95px' }}
                      >
                        <option value="Auto">Auto Cat</option>
                        <option value="Code">Code 🟦</option>
                        <option value="Warmup">Warmup 🟨</option>
                        <option value="Theory">Theory 🟪</option>
                        <option value="Review">Review 🟩</option>
                      </select>

                      <button
                        onClick={() => handleAddSubtask(todo.id, todo.category)}
                        className="btn-primary"
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingSubtaskId(null); setNewSubtaskTitle(''); setNewSubtaskCategory('Auto'); }}
                        className="btn-secondary"
                        style={{ padding: '3px 6px', fontSize: '0.74rem' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
