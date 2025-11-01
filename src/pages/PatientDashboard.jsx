import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Users, BookOpen, FileText, MessageCircle, Star,
  Search, Filter, Calendar, MapPin, LogOut, User
} from 'lucide-react';
import { logo } from '../assets/assets';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const profile = localStorage.getItem('patientProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    } else {
      navigate('/patient/onboarding');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('patientProfile');
    navigate('/');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Heart /> },
    { id: 'experts', label: 'Health Experts', icon: <Users /> },
    { id: 'trials', label: 'Clinical Trials', icon: <FileText /> },
    { id: 'publications', label: 'Publications', icon: <BookOpen /> },
    { id: 'forums', label: 'Forums', icon: <MessageCircle /> },
    { id: 'favorites', label: 'My Favorites', icon: <Star /> },
  ];

  const mockExperts = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Oncology', location: 'Boston, MA', rating: 4.9 },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', location: 'San Francisco, CA', rating: 4.8 },
    { id: 3, name: 'Dr. Emily Williams', specialty: 'Immunology', location: 'New York, NY', rating: 4.9 },
  ];

  const mockTrials = [
    { id: 1, title: 'Phase III Trial for Advanced Lung Cancer', status: 'Recruiting', location: 'Multiple Locations' },
    { id: 2, title: 'Immunotherapy Study for Brain Cancer', status: 'Recruiting', location: 'Boston, MA' },
    { id: 3, title: 'Gene Therapy Clinical Trial', status: 'Enrolling Soon', location: 'San Diego, CA' },
  ];

  const mockPublications = [
    { id: 1, title: 'Recent Advances in Cancer Immunotherapy', journal: 'Nature Medicine', year: 2024 },
    { id: 2, title: 'Targeted Therapy for Glioblastoma', journal: 'The Lancet', year: 2024 },
    { id: 3, title: 'AI in Clinical Trial Matching', journal: 'Science', year: 2023 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Recommended Experts</h3>
                <p className="text-3xl font-bold text-primary-600">12</p>
                <p className="text-sm text-gray-500">Based on your condition</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Matching Trials</h3>
                <p className="text-3xl font-bold text-primary-600">8</p>
                <p className="text-sm text-gray-500">Currently recruiting</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">New Publications</h3>
                <p className="text-3xl font-bold text-primary-600">24</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">New trial matching your criteria</span>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Dr. Johnson accepted meeting request</span>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">New publication in your field</span>
                  <span className="text-xs text-gray-500">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'experts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Health Experts</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search experts..."
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button className="p-2 border rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {mockExperts.map(expert => (
              <div key={expert.id} className="card flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{expert.name}</h3>
                    <p className="text-sm text-gray-600">{expert.specialty}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {expert.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-sm px-4 py-2">Follow</button>
                  <button className="btn-primary text-sm px-4 py-2">Request Meeting</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'trials':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Clinical Trials</h2>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>All Phases</option>
                  <option>Phase I</option>
                  <option>Phase II</option>
                  <option>Phase III</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>All Locations</option>
                  <option>Near Me</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            {mockTrials.map(trial => (
              <div key={trial.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{trial.title}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trial.status === 'Recruiting'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {trial.status}
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        {trial.location}
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary text-sm px-4 py-2">View Details</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'publications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Publications</h2>
              <input
                type="text"
                placeholder="Search publications..."
                className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {mockPublications.map(pub => (
              <div key={pub.id} className="card">
                <h3 className="font-semibold">{pub.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>{pub.journal}</span>
                  <span>•</span>
                  <span>{pub.year}</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Read Summary
                  </button>
                  <span className="text-gray-300">•</span>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Full Paper
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'forums':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Forums</h2>
            <div className="card">
              <h3 className="font-semibold mb-2">Cancer Research Community</h3>
              <p className="text-sm text-gray-600 mb-3">Ask questions and get answers from researchers</p>
              <button className="btn-primary text-sm px-4 py-2">Join Discussion</button>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-2">Clinical Trials Insights</h3>
              <p className="text-sm text-gray-600 mb-3">Learn about ongoing trials and share experiences</p>
              <button className="btn-primary text-sm px-4 py-2">Join Discussion</button>
            </div>
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">My Favorites</h2>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Saved Experts</h3>
                  <p className="text-sm text-gray-600">3 experts saved</p>
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Saved Trials</h3>
                  <p className="text-sm text-gray-600">5 trials saved</p>
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Saved Publications</h3>
                  <p className="text-sm text-gray-600">12 publications saved</p>
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            <p className="text-xs text-gray-600">{userProfile?.condition || 'Patient'}</p>
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

export default PatientDashboard;