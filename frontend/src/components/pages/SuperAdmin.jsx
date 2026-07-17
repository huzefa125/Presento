// eslint-disable-next-line
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../utils/errorTranslator';
import { getSocketUrl } from '../../utils/config';
import { io } from 'socket.io-client';

// Icons
import { 
  TrendingUp, Briefcase, FileText, Lock, ArrowLeft, Plus, Edit2, Trash2, 
  CheckCircle, Clock, MapPin, Users, Download, X, Eye, ChevronDown,
  ChevronUp, Filter, Search, Bell, Building2, DollarSign, Presentation, Save, 
  Activity, Settings, List, Menu, X as XIcon, LogOut, Home, LayoutDashboard
} from 'lucide-react';

// Super Admin Components
import OverviewStats from '../SuperAdmin/Dashboard/OverviewStats';
import UsersList from '../SuperAdmin/Users/UsersList';
import InstitutionsList from '../SuperAdmin/Institutions/InstitutionsList';
import PaymentsList from '../SuperAdmin/Payments/PaymentsList';
import AnalyticsDashboard from '../SuperAdmin/Analytics/AnalyticsDashboard';
import PresentationsList from '../SuperAdmin/Presentations/PresentationsList';
import SystemHealth from '../SuperAdmin/System/SystemHealth';
import SettingsPanel from '../SuperAdmin/Settings/SettingsPanel';
import ActivityLogs from '../SuperAdmin/Activity/ActivityLogs';

const SuperAdmin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [jobPostings, setJobPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: 'Remote / Chennai',
    type: 'Full-time',
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    salaryRange: { min: '', max: '', currency: 'INR' },
    experienceLevel: 'Mid Level',
    status: 'draft',
    expiresAt: ''
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'users', label: 'Users', icon: Users, badge: null },
    { id: 'institutions', label: 'Institutions', icon: Building2, badge: null },
    { id: 'payments', label: 'Payments', icon: DollarSign, badge: null },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
    { id: 'presentations', label: 'Presentations', icon: Presentation, badge: null },
    { id: 'system', label: 'System', icon: Activity, badge: null },
    { id: 'activity', label: 'Activity Logs', icon: List, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase, badge: null },
    { id: 'applications', label: 'Applications', icon: FileText, badge: null }
  ];

  // Check authentication on mount
  useEffect(() => {
    const token = sessionStorage.getItem('superAdminToken');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await api.get('/super-admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem('superAdminToken');
        setIsAuthenticated(false);
      }
    } catch (error) {
      sessionStorage.removeItem('superAdminToken');
      setIsAuthenticated(false);
    }
  };

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(getSocketUrl());
        
    socket.on('new-application', (data) => {
      toast.success(t('toasts.super_admin.new_application', { candidateName: data.candidateName, position: data.position }));
      setNotifications(prev => [data, ...prev]);
      fetchApplications();
      fetchStats();
    });

    socket.on('job-posting-created', () => {
      fetchJobPostings();
    });

    socket.on('job-posting-updated', () => {
      fetchJobPostings();
    });

    socket.on('job-posting-deleted', () => {
      fetchJobPostings();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchJobPostings();
    fetchApplications();
    fetchStats();
  }, [activeTab, isAuthenticated]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }

    try {
      const response = await api.post('/super-admin/login', { password });
      
      if (response.data.success && response.data.token) {
        sessionStorage.setItem('superAdminToken', response.data.token);
        setIsAuthenticated(true);
        setPassword('');
        setPasswordError('');
        toast.success(t('super_admin.access_granted'));
      } else {
        setPasswordError('Invalid password. Please try again.');
        setPassword('');
        toast.error(t('super_admin.invalid_password'));
      }
    } catch (error) {
      const errorMessage = translateError(error, t, 'common.something_went_wrong');
      setPasswordError(errorMessage);
      setPassword('');
      toast.error(errorMessage);
    }
  };

  const fetchJobPostings = async () => {
    try {
      const response = await api.get('/job-postings');
      if (response.data.success) {
        setJobPostings(response.data.data.jobPostings || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast.error(t('super_admin.fetch_job_postings_error'));
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/careers/applications');
      if (response.data.success) {
        setApplications(response.data.data.applications || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/job-postings/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleOpenModal = (job = null) => {
    if (job) {
      setCurrentJob(job);
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || 'Remote / Chennai',
        type: job.type || 'Full-time',
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        salaryRange: job.salaryRange || { min: '', max: '', currency: 'INR' },
        experienceLevel: job.experienceLevel || 'Mid Level',
        status: job.status || 'draft',
        expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : ''
      });
    } else {
      setCurrentJob(null);
      setFormData({
        title: '',
        department: '',
        location: 'Remote / Chennai',
        type: 'Full-time',
        description: '',
        requirements: [],
        responsibilities: [],
        benefits: [],
        salaryRange: { min: '', max: '', currency: 'INR' },
        experienceLevel: 'Mid Level',
        status: 'draft',
        expiresAt: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentJob(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        salaryRange: {
          min: formData.salaryRange.min ? parseInt(formData.salaryRange.min) : null,
          max: formData.salaryRange.max ? parseInt(formData.salaryRange.max) : null,
          currency: formData.salaryRange.currency
        }
      };

      if (currentJob) {
        await api.put(`/job-postings/${currentJob._id}`, payload);
        toast.success(t('super_admin.job_posting_updated'));
      } else {
        await api.post('/job-postings', payload);
        toast.success(t('super_admin.job_posting_created'));
      }

      fetchJobPostings();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving job posting:', error);
      toast.error(translateError(error, t, 'super_admin.save_job_posting_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('super_admin.delete_job_confirm'))) return;

    try {
      await api.delete(`/job-postings/${id}`);
      toast.success(t('super_admin.job_posting_deleted'));
      fetchJobPostings();
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast.error(t('super_admin.delete_job_posting_error'));
    }
  };

  const handleUpdateApplicationStatus = async (id, status) => {
    try {
      await api.patch(`/careers/applications/${id}/status`, { status });
      toast.success(t('super_admin.application_status_updated'));
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('super_admin.update_status_error'));
    }
  };

  const addItem = (type, value) => {
    if (value.trim()) {
      const lines = value.split(/\r?\n/).filter(line => line.trim());
      const processedItems = lines.map(line => {
        let cleaned = line.trim()
          .replace(/^[•\-\*]\s*/, '')
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^[○●▪▫]\s*/, '')
          .trim();
        return cleaned;
      }).filter(item => item.length > 0);

      if (processedItems.length > 0) {
        setFormData(prev => ({
          ...prev,
          [type]: [...prev[type], ...processedItems]
        }));
        if (type === 'requirements') setNewRequirement('');
        if (type === 'responsibilities') setNewResponsibility('');
        if (type === 'benefits') setNewBenefit('');
      }
    }
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const handleDownloadResume = async (resumeUrl, fileName) => {
    try {
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(t('super_admin.resume_downloaded'));
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast.error(t('super_admin.download_resume_error'));
      window.open(resumeUrl, '_blank');
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'shortlisted': return 'bg-blue-500/20 text-blue-400';
      case 'interview': return 'bg-purple-500/20 text-purple-400';
      case 'reviewing': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Super Admin Access
            </h2>
            <p className="text-slate-400">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter admin password"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-xl font-bold text-white">𝑖</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Inavora
                  </h1>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => {
                sessionStorage.removeItem('superAdminToken');
                setIsAuthenticated(false);
                toast.success('Logged out successfully');
                navigate('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 hover:bg-slate-800 rounded-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">
                    {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-slate-400">Manage your platform</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button className="relative p-2 hover:bg-slate-800 rounded-lg">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && <OverviewStats />}

                {/* Users Tab */}
                {activeTab === 'users' && <UsersList />}

                {/* Institutions Tab */}
                {activeTab === 'institutions' && <InstitutionsList />}

                {/* Payments Tab */}
                {activeTab === 'payments' && <PaymentsList />}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && <AnalyticsDashboard />}

                {/* Presentations Tab */}
                {activeTab === 'presentations' && <PresentationsList />}

                {/* System Health Tab */}
                {activeTab === 'system' && <SystemHealth />}

                {/* Activity Logs Tab */}
                {activeTab === 'activity' && <ActivityLogs />}

                {/* Settings Tab */}
                {activeTab === 'settings' && <SettingsPanel />}

                {/* Job Postings Tab */}
                {activeTab === 'jobs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Job Postings</h2>
                        <p className="text-slate-400 mt-1">Manage job postings and applications</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        Create Job Posting
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {jobPostings.map((job) => (
                        <div key={job._id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                              <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {job.department}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {job.applicationCount || 0} applications
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                              <button
                                onClick={() => handleOpenModal(job)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(job._id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-300 line-clamp-2">{job.description}</p>
                        </div>
                      ))}
                      {jobPostings.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No job postings yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">Job Applications</h2>
                      <p className="text-slate-400 mt-1">Review and manage job applications</p>
                    </div>
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app._id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex-1 cursor-pointer" onClick={() => {
                              setSelectedApplication(app);
                              setIsApplicationModalOpen(true);
                            }}>
                              <h3 className="text-lg font-bold">{app.firstName} {app.lastName}</h3>
                              <p className="text-slate-400">{app.email}</p>
                              <p className="text-sm text-slate-500 mt-1">{app.position} - {app.department}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                Applied: {new Date(app.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getApplicationStatusColor(app.status)} text-center sm:text-left`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app._id, e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(app);
                                setIsApplicationModalOpen(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (app.resume?.url) {
                                  handleDownloadResume(app.resume.url, app.resume.fileName);
                                }
                              }}
                              className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Resume
                            </button>
                          </div>
                        </div>
                      ))}
                      {applications.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No applications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Job Posting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                    <h2 className="text-2xl font-bold">{currentJob ? 'Edit Job Posting' : 'Create Job Posting'}</h2>
                    <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-slate-800 rounded-lg">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Senior Frontend Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Department *</label>
                        <input
                          type="text"
                          required
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Engineering"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Job description..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (currentJob ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Application Details Modal */}
      <AnimatePresence>
        {isApplicationModalOpen && selectedApplication && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsApplicationModalOpen(false);
                setSelectedApplication(null);
              }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <h2 className="text-2xl font-bold">Application Details</h2>
                  <button
                    onClick={() => {
                      setIsApplicationModalOpen(false);
                      setSelectedApplication(null);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Name</p>
                        <p className="text-white">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Email</p>
                        <p className="text-white">{selectedApplication.email}</p>
                      </div>
                    </div>
                  </div>
                  {selectedApplication.coverLetter && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Cover Letter</h3>
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <p className="text-slate-300 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdmin;
