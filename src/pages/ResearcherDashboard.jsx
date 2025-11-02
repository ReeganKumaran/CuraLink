import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Users, FileText, MessageCircle, Star, Plus,
  Search, Filter, Calendar, LogOut, User, TrendingUp
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        // Get current user from backend
        const userData = await authService.getCurrentUser();

        // Check if user has correct role
        if (userData.user.role !== 'researcher') {
          navigate('/login');
          return;
        }

        setUserProfile({
          name: userData.user.name,
          email: userData.user.email,
          institution: userData.profile?.institution || 'Not specified',
          specialties: userData.profile?.specialties?.join(', ') || 'Not specified',
          orcid: userData.profile?.orcid,
          researchGateProfile: userData.profile?.researchGateProfile
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Heart /> },
    { id: 'trials', label: 'My Clinical Trials', icon: <FileText /> },
    { id: 'collaborators', label: 'Collaborators', icon: <Users /> },
    { id: 'forums', label: 'Forums', icon: <MessageCircle /> },
    { id: 'publications', label: 'My Publications', icon: <TrendingUp /> },
    { id: 'favorites', label: 'Favorites', icon: <Star /> },
  ];

  const mockTrials = [
    { id: 1, title: 'Phase II Trial for Novel Cancer Treatment', phase: 'Phase II', participants: 45, target: 100, status: 'Recruiting' },
    { id: 2, title: 'Immunotherapy Combination Study', phase: 'Phase III', participants: 120, target: 150, status: 'Recruiting' },
    { id: 3, title: 'Gene Therapy Safety Study', phase: 'Phase I', participants: 12, target: 30, status: 'Active' },
  ];

  const mockCollaborators = [
    { id: 1, name: 'Dr. Lisa Anderson', institution: 'Johns Hopkins', specialty: 'Oncology', publications: 142 },
    { id: 2, name: 'Dr. Robert Kim', institution: 'Stanford Medical', specialty: 'Immunology', publications: 98 },
    { id: 3, name: 'Dr. Maria Garcia', institution: 'Mayo Clinic', specialty: 'Genetics', publications: 176 },
  ];

  const mockForumQuestions = [
    { id: 1, question: 'What are the latest advances in CAR-T therapy?', author: 'Patient123', replies: 3, time: '2 hours ago' },
    { id: 2, question: 'Side effects of immunotherapy treatment?', author: 'CareGiver45', replies: 5, time: '1 day ago' },
    { id: 3, question: 'Clinical trial eligibility criteria clarification', author: 'Patient789', replies: 2, time: '3 days ago' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Active Trials</h3>
                <p className="text-3xl font-bold text-primary-600">3</p>
                <p className="text-xs text-gray-500 mt-1">2 recruiting</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Participants</h3>
                <p className="text-3xl font-bold text-primary-600">177</p>
                <p className="text-xs text-gray-500 mt-1">+12 this month</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Forum Questions</h3>
                <p className="text-3xl font-bold text-primary-600">8</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Collaborators</h3>
                <p className="text-3xl font-bold text-primary-600">24</p>
                <p className="text-xs text-gray-500 mt-1">3 new requests</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Trial Progress</h3>
                {mockTrials.slice(0, 2).map(trial => (
                  <div key={trial.id} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-700">{trial.title}</h4>
                      <span className="text-xs text-gray-500">{trial.phase}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(trial.participants / trial.target) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {trial.participants}/{trial.target} participants
                    </p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Recent Forum Activity</h3>
                <div className="space-y-3">
                  {mockForumQuestions.slice(0, 3).map(q => (
                    <div key={q.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <p className="text-sm text-gray-700 line-clamp-1">{q.question}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">by {q.author}</span>
                        <span className="text-xs text-primary-600 font-medium">Reply</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'trials':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Clinical Trials</h2>
              <button className="btn-primary text-sm px-4 py-2 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add New Trial
              </button>
            </div>

            {mockTrials.map(trial => (
              <div key={trial.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{trial.title}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {trial.phase}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trial.status === 'Recruiting'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {trial.status}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Enrollment Progress</span>
                        <span className="font-medium">{Math.round((trial.participants / trial.target) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(trial.participants / trial.target) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {trial.participants} of {trial.target} participants enrolled
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 space-y-2">
                    <button className="btn-secondary text-sm px-4 py-2 w-full">Manage</button>
                    <button className="btn-primary text-sm px-4 py-2 w-full">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'collaborators':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Collaborators</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search collaborators..."
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {mockCollaborators.map(collab => (
              <div key={collab.id} className="card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{collab.name}</h3>
                    <p className="text-sm text-gray-600">{collab.institution} • {collab.specialty}</p>
                    <p className="text-xs text-gray-500">{collab.publications} publications</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-sm px-4 py-2">Message</button>
                  <button className="btn-primary text-sm px-4 py-2">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'forums':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Forum Questions</h2>
              <select className="px-3 py-2 border rounded-lg text-sm">
                <option>All Categories</option>
                <option>Cancer Research</option>
                <option>Clinical Trials</option>
                <option>Treatment Options</option>
              </select>
            </div>

            {mockForumQuestions.map(q => (
              <div key={q.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{q.question}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>Asked by {q.author}</span>
                      <span>•</span>
                      <span>{q.time}</span>
                      <span>•</span>
                      <span>{q.replies} replies</span>
                    </div>
                  </div>
                  <button className="btn-primary text-sm px-4 py-2">Reply</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'publications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Publications</h2>
              <button className="btn-primary text-sm px-4 py-2 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Publication
              </button>
            </div>
            <div className="card">
              <p className="text-gray-600">
                Your publications will be automatically imported if you provided your ORCID or ResearchGate profile.
              </p>
              <button className="btn-secondary text-sm px-4 py-2 mt-4">Import Publications</button>
            </div>
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Favorites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Saved Trials</h3>
                    <p className="text-sm text-gray-600">3 trials saved</p>
                  </div>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Saved Collaborators</h3>
                    <p className="text-sm text-gray-600">8 researchers saved</p>
                  </div>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center mb-4">
            
            <img src={logo} alt="CuraLink" className="h-8" />
          </div>
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
            <p className="text-xs text-gray-600">{userProfile?.institution || 'Researcher'}</p>
            <p className="text-xs text-gray-500 mt-1">{userProfile?.specialties}</p>
          </div>
        </div>

        <nav className="p-4">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResearcherDashboard;