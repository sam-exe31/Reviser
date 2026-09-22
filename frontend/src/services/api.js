// Same-origin relative in production (the Spring jar serves this SPA), and
// http://localhost:8080 in local dev via .env.development. Never hardcoded.
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            let errorMsg = `HTTP Error ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.message || errData.error || errorMsg;
            } catch (_) { }
            throw new Error(errorMsg);
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (err) {
        if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
            console.error(`API Error on ${endpoint}:`, err);
        }
        throw err;
    }
}

export const api = {
    // Health / Status
    checkHealth: async () => {
        try {
            const res = await fetch(`${API_BASE}/actuator/health`);
            return res.ok;
        } catch {
            return false;
        }
    },

    // Daily & Dashboard
    getTodayOverview: () => request('/daily/today'),
    completeTask: (problemId, category = 'dsa') =>
        request(`/daily/complete/${problemId}?category=${category}`, { method: 'POST' }),
    rolloverMissed: () => request('/daily/rollover', { method: 'POST' }),

    // Monthly Goals & Slicing
    setMonthlyGoal: (goalData) =>
        request('/goals', { method: 'POST', body: JSON.stringify(goalData) }),
    saveGoalDraft: (draftData) =>
        request('/goals/draft', { method: 'POST', body: JSON.stringify(draftData) }),
    getCurrentMonthGoal: () => request('/goals/current'),
    getDailyBreakdown: (date) =>
        request(date ? `/goals/daily?date=${date}` : '/goals/daily'),

    // Problems CRUD
    getProblems: () => request('/problems'),
    getProblem: (id) => request(`/problems/${id}`),
    createProblem: (data) =>
        request('/problems', { method: 'POST', body: JSON.stringify(data) }),
    updateProblem: (id, data) =>
        request(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProblem: (id) => request(`/problems/${id}`, { method: 'DELETE' }),

    // Reviews & Spaced Repetition
    recordReview: (problemId, reviewData) =>
        request(`/problems/${problemId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),
    getReviewHistory: (problemId) =>
        request(`/problems/${problemId}/reviews`),
    getReviewState: (problemId) =>
        request(`/reviews/state/${problemId}`),
    getDueReviews: () => request('/reviews/due'),

    // AI Features
    parseChatMessage: (message) =>
        request('/chat/parse', { method: 'POST', body: JSON.stringify({ message }) }),
    converseWithAi: (message, history = [], mode = 'general') =>
        request('/chat/converse', { method: 'POST', body: JSON.stringify({ message, history, mode }) }),
    planGoalsWithAi: (prompt) =>
        request('/chat/plan-goals', { method: 'POST', body: JSON.stringify({ prompt }) }),
    analyzeGoalLive: (prompt, answers = {}, month, signal) =>
        request('/chat/analyze-goal-live', { method: 'POST', body: JSON.stringify({ prompt, answers, month }), signal }),
    getGoalCrossQuestions: (prompt) =>
        request('/chat/goal-cross-questions', { method: 'POST', body: JSON.stringify({ prompt }) }),
    planDailyWithAi: (prompt) =>
        request('/chat/plan-daily', { method: 'POST', body: JSON.stringify({ prompt }) }),
    planMasterDailyWithAi: (date, weekNumber, prompt) =>
        request('/chat/plan-master-daily', { method: 'POST', body: JSON.stringify({ date, weekNumber, prompt }) }),
    generateSubtasks: (title, category) =>
        request('/chat/generate-subtasks', { method: 'POST', body: JSON.stringify({ title, category }) }),
    getProblemAiInsight: (problemId) =>
        request(`/problems/${problemId}/insight`),
    seedProblems: () =>
        request('/problems/seed-defaults', { method: 'POST' }),
    lookupLeetCode: (number) =>
        request('/chat/leetcode-lookup', { method: 'POST', body: JSON.stringify({ number }) }),
    getLeetCodeRecent: (username, limit = 50) =>
        request('/chat/leetcode-recent', { method: 'POST', body: JSON.stringify({ username, limit }) }),
    evaluateRescheduling: (data) =>
        request('/chat/evaluate-rescheduling', { method: 'POST', body: JSON.stringify(data) }),

    // Daily Todos (DB-backed, replaces localStorage)
    getTodos: (date) => request(date ? `/todos?date=${date}` : '/todos'),
    createTodo: (data) =>
        request('/todos', { method: 'POST', body: JSON.stringify(data) }),
    updateTodo: (id, data) =>
        request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleTodo: (id) =>
        request(`/todos/${id}/toggle`, { method: 'PUT' }),
    deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
    toggleSubtask: (todoId, subtaskId) =>
        request(`/todos/${todoId}/subtasks/${subtaskId}/toggle`, { method: 'PUT' }),
    addSubtask: (todoId, data) =>
        request(`/todos/${todoId}/subtasks`, { method: 'POST', body: JSON.stringify(data) }),
    deleteSubtask: (todoId, subtaskId) =>
        request(`/todos/${todoId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    replaceTodos: (date, todos) =>
        request(`/todos/replace?date=${date}`, { method: 'PUT', body: JSON.stringify(todos) }),

    // Analytics (real DB computation)
    getStreak: () => request('/analytics/streak'),
    getStability: () => request('/analytics/stability'),
    getWeeklyActivity: () => request('/analytics/weekly-activity'),

    // Chat History (DB-backed, PostgreSQL)
    getChatHistory: () => request('/chat/history'),
    saveChatMessage: (msg) =>
        request('/chat/history', { method: 'POST', body: JSON.stringify(msg) }),
    updateChatCardState: (id, data) =>
        request(`/chat/history/${id}/card-state`, { method: 'PUT', body: JSON.stringify(data) }),
    clearChatHistory: () =>
        request('/chat/history', { method: 'DELETE' }),

    // App Settings & Preferences (DB-backed, PostgreSQL)
    getSetting: (key) => request(`/settings/${key}`),
    setSetting: (key, value) =>
        request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};
