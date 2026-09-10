import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DailyTasks from './pages/DailyTasks';
import ProblemLibrary from './pages/ProblemLibrary';
import MonthlyGoals from './pages/MonthlyGoals';
import HistoryInsights from './pages/HistoryInsights';
import ChatAssistant from './components/ChatAssistant';
import ReviewModal from './components/ReviewModal';
import AddProblemModal from './components/AddProblemModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviewModalProblem, setReviewModalProblem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [historyTargetProblem, setHistoryTargetProblem] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDueCount = async () => {
    try {
      const due = await api.getDueReviews();
      setDueCount(due ? due.length : 0);
    } catch (_) {
      setDueCount(0);
    }
  };

  useEffect(() => {
    loadDueCount();
  }, [refreshKey]);

  const handleStartReview = (problem) => {
    setReviewModalProblem(problem);
  };

  const handleViewHistory = (problem) => {
    setHistoryTargetProblem(problem);
    setActiveTab('history');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Today & Due';
      case 'chat':
        return 'AI Assistant';
      case 'goals':
        return 'Monthly Goals';
      case 'library':
        return 'Problem Bank';
      case 'history':
        return 'Review & Insights';
      default:
        return 'Reviser';
    }
  };

  return (
    <div className="rv-shell">
      {/* Rail Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        dueCount={dueCount}
      />

      {/* Main Reading View */}
      <main className="rv-main">
        <Header
          title={getPageTitle()}
          onRefresh={handleRefresh}
        />

        <div style={{ flex: 1, position: 'relative' }}>
          {/* Dashboard Tab */}
          <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
            <Dashboard
              key={`dash-${refreshKey}`}
              onNavigate={setActiveTab}
              onStartReview={handleStartReview}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>

          {/* Today & Due Tasks Tab */}
          <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
            <DailyTasks
              key={`tasks-${refreshKey}`}
              onStartReview={handleStartReview}
              onNavigateToChat={() => setActiveTab('chat')}
              onNavigateToLibrary={() => setActiveTab('library')}
            />
          </div>

          {/* AI Chat Assistant Tab (Kept Mounted To Preserve Conversation & Inputs) */}
          <div style={{ display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column', height: 'calc(100vh - 63px)', overflow: 'hidden' }}>
            <ChatAssistant
              onTaskLogged={() => {
                loadDueCount();
                handleRefresh();
              }}
              onNavigateToGoals={() => setActiveTab('goals')}
              onOpenReviewModal={handleStartReview}
            />
          </div>

          {/* Problem Bank Library Tab */}
          <div style={{ display: activeTab === 'library' ? 'block' : 'none' }}>
            <ProblemLibrary
              key={`lib-${refreshKey}`}
              onStartReview={handleStartReview}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onViewHistory={handleViewHistory}
            />
          </div>

          {/* Monthly Goals Tab */}
          <div style={{ display: activeTab === 'goals' ? 'block' : 'none' }}>
            <MonthlyGoals key={`goals-${refreshKey}`} />
          </div>

          {/* History Insights Tab */}
          <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
            <HistoryInsights
              key={`hist-${refreshKey}`}
              initialProblem={historyTargetProblem}
            />
          </div>
        </div>
      </main>

      {/* Spaced Repetition Review Modal */}
      {reviewModalProblem && (
        <ReviewModal
          problem={reviewModalProblem}
          onClose={() => setReviewModalProblem(null)}
          onReviewSubmitted={() => {
            loadDueCount();
            handleRefresh();
          }}
        />
      )}

      {/* Add Problem Modal */}
      {isAddModalOpen && (
        <AddProblemModal
          onClose={() => setIsAddModalOpen(false)}
          onProblemAdded={() => {
            loadDueCount();
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
