import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Check,
  Clock,
  Tag,
  CheckCircle2,
  Brain,
  Target,
  BookOpen,
  Code,
  Zap,
  Star,
  Layers,
  RotateCcw,
  HelpCircle,
  Terminal,
  Command,
  Copy,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const initialWelcome = {
  id: 'init-1',
  sender: 'bot',
  text: "### 💬 Reviser AI Mentor & Engineering Assistant\n\nI can help you with:\n\n* ☕ **DSA, Algorithms & Spring Boot**: Ask any engineering questions, code reviews, or architectural discussions.\n* ⚙️ **Core CS Topics**: Deep-dives on **Operating Systems (OS)**, **DBMS**, **Computer Networks**, and **System Design**.\n* ⚡ **Log Solved Problems with `/solved <number>`**: Type `/solved 56` to inspect official LeetCode stats, fill your 4-line journal (Trigger, Template, Variant, Failure), and schedule SM-2 spaced repetition.",
  timestamp: new Date()
};

const SLASH_COMMANDS = [
  {
    command: '/solve',
    syntax: '/solve <number or name>',
    description: 'Break down problem in Java, rate confidence (1-5) & schedule SM-2 repetition',
    example: '/solve 56'
  },
  {
    command: '/solved',
    syntax: '/solved <number or name>',
    description: 'Log solved problem with Java breakdown and schedule SM-2 repetition',
    example: '/solved 56'
  },
  {
    command: '/explain',
    syntax: '/explain <number or name>',
    description: 'Deep-dive intuition, pattern & optimal Java solution',
    example: '/explain 67'
  },
  {
    command: '/hint',
    syntax: '/hint <number or name>',
    description: 'Progressive hints without spoiling the full solution',
    example: '/hint 206'
  },
  {
    command: '/pattern',
    syntax: '/pattern <name>',
    description: 'Explain core DSA pattern (Sliding Window, Two Pointers, Monotonic Stack)',
    example: '/pattern Sliding Window'
  },
  {
    command: '/revise',
    syntax: '/revise',
    description: 'Check what problems are due for spaced review today',
    example: '/revise'
  },
  {
    command: '/clear',
    syntax: '/clear',
    description: 'Clear chat conversation history and start fresh',
    example: '/clear'
  }
];

// Helper: Syntax Highlighting for Java / SQL / General Code
function highlightLine(line) {
  // Matches tokens: comments, strings, annotations, numbers, words
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|--[^\n]*|"(?:\\.|[^"\\])*"|'[^']*'|@\w+|\b\d+(?:\.\d+)?(?:[fFdDlL])?\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[^\s\w])/g;

  const keywords = new Set([
    'public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized', 'volatile',
    'transient', 'native', 'strictfp', 'class', 'interface', 'enum', 'record', 'extends', 'implements',
    'throws', 'throw', 'try', 'catch', 'finally', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'default', 'new', 'instanceof', 'assert', 'package',
    'import', 'var', 'const', 'let', 'function', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO',
    'UPDATE', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'GROUP', 'BY', 'ORDER', 'HAVING',
    'LIMIT', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
    'UNION', 'ALL', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL'
  ]);

  const types = new Set([
    'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void',
    'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short',
    'Object', 'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap', 'LinkedHashMap',
    'Set', 'HashSet', 'TreeSet', 'Queue', 'Deque', 'ArrayDeque', 'PriorityQueue', 'Stack',
    'Vector', 'Arrays', 'Collections', 'Math', 'StringBuilder', 'StringBuffer', 'TreeNode',
    'ListNode', 'Node', 'Pair', 'Optional', 'Comparable', 'Comparator', 'Iterator', 'Iterable',
    'Stream', 'Scanner', 'System', 'true', 'false', 'null', 'this', 'super'
  ]);

  const spans = [];
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      spans.push(<span key={lastIdx}>{line.substring(lastIdx, match.index)}</span>);
    }

    const token = match[0];
    let color = '#f4f4f5';
    let fontStyle = 'normal';

    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('--')) {
      color = '#71717a';
      fontStyle = 'italic';
    } else if (token.startsWith('"') || token.startsWith("'")) {
      color = '#34d399'; // emerald green
    } else if (token.startsWith('@')) {
      color = '#facc15'; // amber
    } else if (/^\d/.test(token)) {
      color = '#fb923c'; // orange
    } else if (keywords.has(token) || keywords.has(token.toUpperCase())) {
      color = '#c084fc'; // purple
    } else if (types.has(token)) {
      color = '#38bdf8'; // sky blue
    }

    spans.push(
      <span key={match.index} style={{ color, fontStyle, fontWeight: keywords.has(token) ? '600' : '400' }}>
        {token}
      </span>
    );

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    spans.push(<span key={lastIdx}>{line.substring(lastIdx)}</span>);
  }

  return spans.length > 0 ? spans : ' ';
}

// Beautiful Code Block Component with Syntax Highlighting, Line Numbers, and Copy
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const cleanCode = (code || '').replace(/^\r?\n+|\r?\n+$/g, '');
  const lines = cleanCode.split(/\r?\n/);
  const displayLang = (language || 'java').toUpperCase();

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) { }
  };

  return (
    <div style={{
      margin: '14px 0',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--code-border)',
      backgroundColor: 'var(--code-bg)',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* Code Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'var(--code-header-bg)',
        borderBottom: '1px solid var(--code-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
          <span style={{
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--code-lang)',
            letterSpacing: '0.6px',
            backgroundColor: 'rgba(94, 234, 212, 0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(94, 234, 212, 0.25)'
          }}>
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: copied ? '#34d399' : 'var(--text-muted)',
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            transition: 'all 0.15s ease'
          }}
          title="Copy code to clipboard"
        >
          {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
          <span style={{ fontWeight: '600' }}>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>

      {/* Code Body with Line Numbers */}
      <div style={{
        padding: '14px 16px',
        overflowX: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.86rem',
        lineHeight: '1.65',
        backgroundColor: 'var(--code-bg)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {lines.map((ln, idx) => (
          <div key={idx} style={{ display: 'flex', minWidth: 'fit-content' }}>
            <span style={{
              width: '32px',
              textAlign: 'right',
              marginRight: '16px',
              color: '#52525b',
              userSelect: 'none',
              fontSize: '0.78rem',
              flexShrink: 0
            }}>
              {idx + 1}
            </span>
            <span style={{ flex: 1, whiteSpace: 'pre' }}>
              {highlightLine(ln)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatAssistant({ onTaskLogged, onNavigateToGoals, onOpenReviewModal }) {
  const [activeMode, setActiveMode] = useState('assistant');

  // Persistent conversation history loaded from PostgreSQL database
  const [messages, setMessages] = useState([initialWelcome]);
  const [problemCardStates, setProblemCardStates] = useState({});

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history and card states from PostgreSQL
  useEffect(() => {
    api.getChatHistory()
      .then((history) => {
        if (history && history.length > 0) {
          const restoredCards = {};
          const mappedMessages = history.map((m) => {
            let detected = null;
            if (m.detectedProblemTitle) {
              detected = {
                problemTitle: m.detectedProblemTitle,
                platform: m.detectedProblemPlatform || 'LeetCode',
                difficulty: m.detectedProblemDifficulty || 'Medium',
                pattern: m.detectedProblemPattern || 'General DSA'
              };
            }

            if (m.cardStateJson) {
              try {
                const parsed = JSON.parse(m.cardStateJson);
                restoredCards[String(m.id)] = parsed;
                // A dismissed detection card must stay dismissed across reloads
                if (parsed && parsed.dismissed) {
                  detected = null;
                }
              } catch (_) { }
            }

            return {
              id: String(m.id),
              sender: m.sender,
              text: m.text,
              detectedProblem: detected,
              suggestedSolveCommand: m.suggestedSolveCommand,
              confirmed: m.confirmed,
              savedProblemId: m.savedProblemId,
              savedRating: m.savedRating,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            };
          });

          setMessages(mappedMessages);
          setProblemCardStates(restoredCards);
        }
      })
      .catch((err) => {
        console.warn('Could not load chat history from database:', err);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Filter commands based on current input
  const filteredCommands = SLASH_COMMANDS.filter(cmd => {
    if (!input.startsWith('/')) return false;
    const query = input.toLowerCase();
    return cmd.command.toLowerCase().startsWith(query) ||
      cmd.syntax.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query);
  });

  // Track if slash menu should be open
  useEffect(() => {
    if (input.startsWith('/') && !input.includes(' ')) {
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [input]);

  const handleClearHistory = async () => {
    if (window.confirm('Clear conversation history from database and start a fresh session?')) {
      try {
        await api.clearChatHistory();
      } catch (err) {
        console.warn('Error clearing history from DB:', err);
      }
      setMessages([initialWelcome]);
      setProblemCardStates({});
    }
  };

  const quickPrompts = [
    { label: '🧩 Explain LC 56 (Java)', prompt: 'Explain LeetCode 56 Merge Intervals with Java solution' },
    { label: '⚡ /solve 56', prompt: '/solve 56' },
    { label: '⚡ /solve 67', prompt: '/solve 67' },
    { label: '⚙️ OS Deadlock Prevention', prompt: 'Explain Deadlock conditions and prevention strategies in Operating Systems' },
    { label: '🗄️ DBMS Normalization (1NF-BCNF)', prompt: 'Explain 1NF, 2NF, 3NF, and BCNF Normalization with real database schema examples' },
    { label: '🌐 TCP 3-Way Handshake', prompt: 'Explain the TCP 3-way handshake and connection teardown with diagrams' },
    { label: '🧠 Sliding Window Pattern', prompt: 'Explain the Sliding Window pattern in Java with examples' }
  ];

  const handleSelectCommand = (cmd) => {
    if (cmd.command === '/clear') {
      setInput('');
      setShowSlashMenu(false);
      handleClearHistory();
      return;
    }

    if (cmd.command === '/revise') {
      setInput('');
      setShowSlashMenu(false);
      handleSend('What problems should I revise today?');
      return;
    }

    setInput(cmd.command + ' ');
    setShowSlashMenu(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          handleSelectCommand(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    if (query.trim() === '/clear') {
      setInput('');
      setShowSlashMenu(false);
      handleClearHistory();
      return;
    }

    let savedUserMsg = null;
    try {
      savedUserMsg = await api.saveChatMessage({
        sender: 'user',
        text: query.trim()
      });
    } catch (err) {
      console.warn('Could not save user message to DB:', err);
    }

    const userMsg = {
      id: savedUserMsg ? String(savedUserMsg.id) : String(Date.now()),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date()
    };

    const newHistory = messages
      .filter(m => !m.id.includes('init-1'))
      .slice(-6)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowSlashMenu(false);
    setLoading(true);

    try {
      const response = await api.converseWithAi(query.trim(), newHistory, activeMode);

      // Fallback: If user explicitly typed /solved <number> or /solve <number> and detectedProblem is missing info
      const solveMatch = query.trim().match(/^\/solved?\s+(\d{1,5})/i);
      if (solveMatch && (!response.detectedProblem || !response.detectedProblem.problemTitle)) {
        try {
          const lcLookup = await api.lookupLeetCode(solveMatch[1]);
          if (lcLookup && lcLookup.found) {
            response.detectedProblem = {
              problemNumber: Number(solveMatch[1]),
              problemTitle: lcLookup.title,
              platform: 'LeetCode',
              difficulty: lcLookup.difficulty || 'Medium',
              pattern: lcLookup.pattern || 'General DSA',
              tags: lcLookup.tags || '',
              description: lcLookup.description || null,
              confidence: 4
            };
          }
        } catch (lcErr) {
          console.warn('Frontend direct LeetCode lookup fallback error:', lcErr);
        }
      }

      const botPayload = {
        sender: 'bot',
        text: response.reply || "I've processed your message. Let me know what you'd like to work on!",
        detectedProblemTitle: response.detectedProblem ? response.detectedProblem.problemTitle : null,
        detectedProblemPlatform: response.detectedProblem ? response.detectedProblem.platform : null,
        detectedProblemDifficulty: response.detectedProblem ? response.detectedProblem.difficulty : null,
        detectedProblemPattern: response.detectedProblem ? (response.detectedProblem.pattern || response.detectedProblem.topic) : null,
        suggestedSolveCommand: response.suggestedSolveCommand || null,
        confirmed: false
      };

      let savedBotMsg = null;
      try {
        savedBotMsg = await api.saveChatMessage(botPayload);
      } catch (err) {
        console.warn('Could not save bot response to DB:', err);
      }

      const botMsgId = savedBotMsg ? String(savedBotMsg.id) : String(Date.now() + 1);
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: botPayload.text,
        detectedProblem: response.detectedProblem || null,
        suggestedSolveCommand: response.suggestedSolveCommand || null,
        timestamp: new Date()
      };

      if (response.detectedProblem) {
        setProblemCardStates(prev => ({
          ...prev,
          [botMsgId]: {
            confidence: response.detectedProblem.confidence || 4,
            solvedWithoutHelp: true,
            neededHint: false,
            rememberedPattern: true,
            couldExplainSolution: true,
            journalTrigger: '',
            journalTemplate: response.detectedProblem.pattern || '',
            journalVariant: '',
            journalFailure: '',
            customDescription: '',
            notes: ''
          }
        }));
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (_) {
      const fallbackText = `I've noted your query: "${query.trim()}". You can ask about any problem, OS/DBMS questions, or type \`/solve <number>\` (e.g. \`/solve 56\`) to log problems.`;
      let savedFallback = null;
      try {
        savedFallback = await api.saveChatMessage({ sender: 'bot', text: fallbackText });
      } catch (e) { }

      setMessages(prev => [
        ...prev,
        {
          id: savedFallback ? String(savedFallback.id) : String(Date.now() + 1),
          sender: 'bot',
          text: fallbackText,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (msgId, rating) => {
    setProblemCardStates(prev => ({
      ...prev,
      [msgId]: {
        ...(prev[msgId] || { solvedWithoutHelp: true, rememberedPattern: true, couldExplainSolution: true, notes: '' }),
        confidence: rating
      }
    }));
  };

  const handleNotesChange = (msgId, notes) => {
    setProblemCardStates(prev => ({
      ...prev,
      [msgId]: {
        ...(prev[msgId] || { confidence: 4, solvedWithoutHelp: true, rememberedPattern: true, couldExplainSolution: true }),
        notes
      }
    }));
  };

  const handleFieldChange = (msgId, field, value) => {
    setProblemCardStates(prev => ({
      ...prev,
      [msgId]: {
        ...(prev[msgId] || { confidence: 4, solvedWithoutHelp: true, rememberedPattern: true, couldExplainSolution: true, notes: '' }),
        [field]: value
      }
    }));
  };

  const handleCheckboxToggle = (msgId, field) => {
    setProblemCardStates(prev => {
      const current = prev[msgId] || { confidence: 4, solvedWithoutHelp: true, neededHint: false, rememberedPattern: true, couldExplainSolution: true, notes: '' };
      return {
        ...prev,
        [msgId]: {
          ...current,
          [field]: !current[field]
        }
      };
    });
  };

  const handleConfirmAndSaveProblem = async (msgId, detectedData) => {
    const cardState = problemCardStates[msgId] || {
      confidence: detectedData.confidence || 4,
      solvedWithoutHelp: true,
      neededHint: false,
      rememberedPattern: true,
      couldExplainSolution: true,
      notes: ''
    };

    let diff = 'Medium';
    if (detectedData.difficulty) {
      const dLower = detectedData.difficulty.toLowerCase();
      if (dLower.includes('easy')) diff = 'Easy';
      else if (dLower.includes('hard')) diff = 'Hard';
      else diff = 'Medium';
    }

    const journalText = [
      '=== 4-Line DSA Journal ===',
      `• Trigger: ${cardState.journalTrigger?.trim() || 'Recognized pattern in problem statement'}`,
      `• Template: ${cardState.journalTemplate?.trim() || (detectedData.pattern || 'Standard DSA Template')}`,
      `• Variant: ${cardState.journalVariant?.trim() || 'Standard problem formulation'}`,
      `• Failure: ${cardState.journalFailure?.trim() || 'First-pass clean / none'}`
    ].join('\n');

    const descSection = (detectedData.description || cardState.customDescription)
      ? `=== Description ===\n${(detectedData.description || cardState.customDescription).trim()}\n\n`
      : '';

    const addNotes = cardState.notes?.trim() ? `\n=== Additional Notes ===\n${cardState.notes.trim()}` : '';
    const fullNotes = `${descSection}${journalText}${addNotes}`;

    try {
      const problemPayload = {
        title: detectedData.problemTitle || 'Coding Problem',
        platform: detectedData.platform || 'LeetCode',
        difficulty: diff,
        pattern: detectedData.pattern || detectedData.topic || 'General DSA',
        notes: fullNotes
      };

      const created = await api.createProblem(problemPayload);

      // Record initial review with user's rating & self-assessment
      await api.recordReview(created.id, {
        confidence: cardState.confidence || 4,
        solvedWithoutHelp: cardState.solvedWithoutHelp ?? true,
        neededHint: cardState.neededHint ?? false,
        rememberedPattern: cardState.rememberedPattern ?? true,
        couldExplainSolution: cardState.couldExplainSolution ?? true,
        notes: fullNotes
      });

      // Persist card confirmation & rating to PostgreSQL
      if (msgId && !isNaN(Number(msgId))) {
        api.updateChatCardState(Number(msgId), {
          confirmed: true,
          savedProblemId: created.id,
          savedRating: cardState.confidence || 4,
          cardStateJson: JSON.stringify(cardState)
        }).catch(err => console.warn('Could not update card state in DB:', err));
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a']
      });

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            confirmed: true,
            savedProblemId: created.id,
            savedRating: cardState.confidence || 4
          };
        }
        return m;
      }));

      if (onTaskLogged) onTaskLogged(created);
    } catch (err) {
      alert('Failed to save problem to bank: ' + err.message);
    }
  };

  const handleDismissProblem = (msgId) => {
    // Hide the detected-problem card immediately (local state)
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, detectedProblem: null } : m
    ));
    setProblemCardStates(prev => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });

    // Persist the dismissal so the card doesn't reappear after reload. The
    // card-state endpoint only accepts cardStateJson, so mark the flag there.
    if (msgId && !isNaN(Number(msgId))) {
      api.updateChatCardState(Number(msgId), {
        cardStateJson: JSON.stringify({ dismissed: true })
      }).catch(err => console.warn('Could not persist card dismissal:', err));
    }
  };

  const renderTextChunk = (textChunk, baseKey) => {
    const lines = textChunk.split('\n');
    return (
      <div key={baseKey}>
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-serif" style={{
                fontSize: '1.1rem',
                color: 'var(--text-serif-title)',
                margin: '14px 0 6px 0',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-serif" style={{
                fontSize: '1.25rem',
                color: 'var(--text-serif-title)',
                margin: '16px 0 8px 0',
                fontWeight: '600',
                letterSpacing: '-0.2px'
              }}>
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
            const content = line.replace(/^[\*\-•]\s*/, '');
            return (
              <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '4px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>•</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{renderInlineFormatting(content)}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} style={{ margin: '5px 0', paddingLeft: '4px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                {renderInlineFormatting(line)}
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} style={{ height: '6px' }} />;
          }
          return <p key={idx} style={{ margin: '3px 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  const renderFormattedMarkdown = (text) => {
    if (!text) return null;

    // Split text by ```code blocks``` (handles language identifier and CRLF)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)[^\n\r]*[\r\n]+([\s\S]*?)```/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textChunk = text.slice(lastIndex, match.index);
        elements.push(renderTextChunk(textChunk, `text-${lastIndex}`));
      }

      const lang = match[1] || 'java';
      const code = match[2];
      elements.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      elements.push(renderTextChunk(remaining, `text-${lastIndex}`));
    }

    return elements;
  };

  const renderInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-serif-title)', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} style={{ color: 'var(--text-muted)' }}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{
            backgroundColor: 'var(--bg-card-inset)',
            padding: '2px 7px',
            borderRadius: '5px',
            color: 'var(--accent-cyan)',
            fontSize: '0.86em',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-main)'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-main)',
      position: 'relative'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '14px 28px',
        borderBottom: '1px solid var(--border-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-sidebar)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-serif-title)', letterSpacing: '0.2px' }}>
              AI Study Mentor & Assistant (Java Default)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Ask any DSA problem, OS/DBMS questions, or type <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>/solve &lt;problem&gt;</span> to log & rate revisions
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleClearHistory}
            className="btn-secondary"
            title="Start a new chat session"
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>

          {onNavigateToGoals && (
            <button
              onClick={onNavigateToGoals}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Target size={14} color="var(--accent-amber)" />
              <span>Monthly Goals</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const cardState = problemCardStates[msg.id] || { confidence: 4, solvedWithoutHelp: true, rememberedPattern: true, couldExplainSolution: true };

          return (
            <div
              key={msg.id}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '75%' : '86%'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(130, 70, 214, 0.25)'
                }}>
                  <Sparkles size={16} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {/* Message Bubble */}
                <div style={{
                  padding: isUser ? '12px 18px' : '18px 22px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px',
                  backgroundColor: isUser ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: isUser ? '1px solid var(--accent-cyan)' : '1px solid var(--border-main)',
                  color: isUser ? 'var(--text-serif-title)' : 'var(--text-main)',
                  lineHeight: '1.65',
                  boxShadow: 'var(--shadow-card)'
                }}>
                  {renderFormattedMarkdown(msg.text)}
                </div>

                {/* Detected Problem Action Card with Notes & Rating & SM-2 Ingestion */}
                {msg.detectedProblem && !msg.confirmed && (
                  <div className="claude-artifact animate-scale-in" style={{
                    marginTop: '8px',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                    boxShadow: 'var(--shadow-popover)',
                    background: 'var(--bg-card)'
                  }}>
                    {/* Header */}
                    <div className="claude-artifact-header" style={{
                      background: 'var(--bg-card-inset)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          backgroundColor: 'var(--accent-cyan)',
                          color: '#0c0e14',
                          fontWeight: '800',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          textTransform: 'uppercase'
                        }}>
                          {msg.detectedProblem.platform || 'LeetCode'} {msg.detectedProblem.problemNumber ? `#${msg.detectedProblem.problemNumber}` : ''}
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-serif-title)' }}>
                          {msg.detectedProblem.problemTitle || 'Identified Problem'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {msg.detectedProblem.difficulty && (
                          <span className={`badge badge-${msg.detectedProblem.difficulty.toLowerCase()}`}>
                            {msg.detectedProblem.difficulty}
                          </span>
                        )}
                        {msg.detectedProblem.pattern && (
                          <span className="badge badge-purple">
                            {msg.detectedProblem.pattern}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDismissProblem(msg.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '4px'
                          }}
                          title="Dismiss detection"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Body Details */}
                    <div className="claude-artifact-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>

                      {/* LeetCode Description / Constraints */}
                      {msg.detectedProblem.description ? (
                        <div style={{
                          backgroundColor: 'var(--bg-card-inset)',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-main)',
                          maxHeight: '180px',
                          overflowY: 'auto'
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Official Problem Description
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                            {msg.detectedProblem.description}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.08)',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚠️ Description could not be fetched automatically. Please paste description below:
                          </div>
                          <textarea
                            placeholder="Paste problem description / constraints / examples here..."
                            value={cardState.customDescription || ''}
                            onChange={(e) => handleFieldChange(msg.id, 'customDescription', e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              backgroundColor: 'var(--bg-card)',
                              border: '1px solid var(--border-main)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px 10px',
                              color: 'var(--text-main)',
                              fontSize: '0.82rem',
                              outline: 'none',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>
                      )}

                      {/* Metadata Chips */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card-inset)',
                          border: '1px solid var(--border-main)',
                          color: 'var(--text-muted)',
                          fontWeight: '600'
                        }}>
                          Tags: <strong style={{ color: 'var(--text-main)' }}>{msg.detectedProblem.tags || msg.detectedProblem.pattern || 'General DSA'}</strong>
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card-inset)',
                          border: '1px solid var(--border-main)',
                          color: 'var(--text-muted)',
                          fontWeight: '600'
                        }}>
                          Difficulty: <strong style={{ color: 'var(--text-main)' }}>{msg.detectedProblem.difficulty || 'Medium'}</strong>
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(52, 211, 153, 0.12)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          color: 'var(--accent-emerald)',
                          fontWeight: '700'
                        }}>
                          SM-2 Spaced Repetition Ready
                        </span>
                      </div>

                      {/* 4-Line DSA Journal Form */}
                      <div style={{
                        background: 'var(--bg-card-inset)',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={14} /> 4-Line DSA Journal (Roadmap Spec)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              1. Trigger <span style={{ fontWeight: '400', color: 'var(--text-dim)' }}>(statement signal)</span>
                            </label>
                            <input
                              type="text"
                              value={cardState.journalTrigger || ''}
                              onChange={(e) => handleFieldChange(msg.id, 'journalTrigger', e.target.value)}
                              placeholder="e.g. At most k elements / sorted order"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              2. Template <span style={{ fontWeight: '400', color: 'var(--text-dim)' }}>(pattern name)</span>
                            </label>
                            <input
                              type="text"
                              value={cardState.journalTemplate || ''}
                              onChange={(e) => handleFieldChange(msg.id, 'journalTemplate', e.target.value)}
                              placeholder="e.g. Sliding Window / Monotonic Stack"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              3. Variant <span style={{ fontWeight: '400', color: 'var(--text-dim)' }}>(how it deviated)</span>
                            </label>
                            <input
                              type="text"
                              value={cardState.journalVariant || ''}
                              onChange={(e) => handleFieldChange(msg.id, 'journalVariant', e.target.value)}
                              placeholder="e.g. Shrink condition needed count = 0"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              4. Failure <span style={{ fontWeight: '400', color: 'var(--text-dim)' }}>(what broke on 1st run)</span>
                            </label>
                            <input
                              type="text"
                              value={cardState.journalFailure || ''}
                              onChange={(e) => handleFieldChange(msg.id, 'journalFailure', e.target.value)}
                              placeholder="e.g. Off-by-one / integer overflow / empty string"
                              className="form-input"
                              style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Confidence / Recall Rating (1 to 5) */}
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Select SM-2 Recall Rating (Quality of Recall):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                          {[
                            { val: 1, label: '1 - Struggled', desc: 'Repeat ASAP', color: '#f43f5e' },
                            { val: 2, label: '2 - Hard', desc: 'Needed Hint', color: '#fb7185' },
                            { val: 3, label: '3 - Moderate', desc: 'Pass with effort', color: '#d97706' },
                            { val: 4, label: '4 - Good', desc: 'Minor hesitation', color: '#34d399' },
                            { val: 5, label: '5 - Mastered', desc: 'Flawless recall', color: '#38bdf8' }
                          ].map(opt => {
                            const isSelected = cardState.confidence === opt.val;
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => handleRatingChange(msg.id, opt.val)}
                                style={{
                                  padding: '8px 6px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card-inset)',
                                  border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-main)',
                                  color: isSelected ? opt.color : 'var(--text-muted)',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: opt.color }}>
                                  {'★'.repeat(opt.val)}
                                </div>
                                <div style={{ fontSize: '0.74rem', fontWeight: '600', marginTop: '2px' }}>
                                  {opt.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes / Reflections Input */}
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={13} color="var(--accent-cyan)" /> Additional Notes & Key Edge Cases (Optional)
                        </div>
                        <textarea
                          value={cardState.notes || ''}
                          onChange={(e) => handleNotesChange(msg.id, e.target.value)}
                          placeholder="Write down tricky corner cases or key intuition reminders..."
                          rows={2}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-card-inset)',
                            border: '1px solid var(--border-main)',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 12px',
                            color: 'var(--text-main)',
                            fontSize: '0.84rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      {/* Quick Self-Assessment Checkboxes */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={cardState.solvedWithoutHelp ?? true}
                            onChange={() => handleCheckboxToggle(msg.id, 'solvedWithoutHelp')}
                            style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                          />
                          <span>Solved without help</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={cardState.rememberedPattern ?? true}
                            onChange={() => handleCheckboxToggle(msg.id, 'rememberedPattern')}
                            style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                          />
                          <span>Remembered core pattern</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={cardState.couldExplainSolution ?? true}
                            onChange={() => handleCheckboxToggle(msg.id, 'couldExplainSolution')}
                            style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                          />
                          <span>Could explain intuition</span>
                        </label>
                      </div>

                      {/* Submit Ingestion Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                        <button
                          onClick={() => handleConfirmAndSaveProblem(msg.id, msg.detectedProblem)}
                          className="btn-primary"
                          style={{ padding: '9px 20px', fontSize: '0.88rem' }}
                        >
                          <Check size={16} />
                          <span>Confirm & Save to Spaced Repetition Bank</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmed Success State */}
                {msg.confirmed && (
                  <div className="animate-scale-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(5, 150, 105, 0.12)',
                    border: '1px solid rgba(5, 150, 105, 0.35)',
                    color: '#047857',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    alignSelf: 'flex-start',
                    boxShadow: '0 0 16px rgba(5, 150, 105, 0.15)'
                  }}>
                    <CheckCircle2 size={17} color="#059669" />
                    <span>Added to Spaced Repetition Bank with Rating ({msg.savedRating || 4}/5) • Next Review Scheduled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <span className="pulsing-dot" style={{ backgroundColor: 'var(--accent-cyan)' }} />
              <span>Analyzing query & crafting optimal Java breakdown...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{
        padding: '8px 28px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        backgroundColor: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-main)'
      }}>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              e.currentTarget.style.color = 'var(--accent-cyan)';
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-main)';
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Form Bar Container with Dropdown */}
      <div style={{
        padding: '14px 28px 18px 28px',
        backgroundColor: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-main)',
        position: 'relative'
      }}>
        {/* Floating Slash Command Autocomplete Dropdown */}
        {showSlashMenu && filteredCommands.length > 0 && (
          <div
            className="animate-scale-in"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '28px',
              right: '28px',
              marginBottom: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-popover)',
              overflow: 'hidden',
              zIndex: 100,
              maxHeight: '280px',
              overflowY: 'auto'
            }}
          >
            <div style={{
              padding: '8px 14px',
              fontSize: '0.72rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              letterSpacing: '0.8px',
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Available Slash Commands</span>
              <span>Use ↑↓ and Enter</span>
            </div>

            <div style={{ padding: '4px' }}>
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={cmd.command}
                    onClick={() => handleSelectCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '3px 7px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'var(--accent-cyan)' : 'var(--bg-card-inset)',
                        color: isSelected ? '#0c0e14' : 'var(--text-main)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        fontWeight: '700'
                      }}>
                        {cmd.command}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', fontWeight: isSelected ? '700' : '500' }}>
                        {cmd.description}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {cmd.example}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-card-inset)',
            padding: '6px 10px 6px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask any DSA problem, OS, DBMS question, or type / to view commands..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-serif-title)',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              opacity: !input.trim() || loading ? 0.4 : 1,
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
