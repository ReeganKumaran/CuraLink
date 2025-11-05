import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Book, ExternalLink, Star, Loader, BookmarkPlus, BookmarkCheck,
  Heart, Users, FileText, MessageCircle, LogOut, BookOpen
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import publicationService from '../services/publicationService';

const Publications = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedPmids, setSavedPmids] = useState(new Set());

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        const condition = userData.profile?.condition || 'Not specified';

        setUserProfile({
          name: userData.user.name,
          role: userData.user.role,
          condition: condition,
        });
        setUserLoading(false);

        // Auto-search by patient condition if available
        if (userData.user.role === 'patient' && condition && condition !== 'Not specified') {
          setSearchQuery(condition);
          // Trigger search automatically
          setTimeout(() => {
            performSearch(condition);
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const sidebarItems = userProfile?.role === 'patient'
    ? [
        { id: 'overview', label: 'Overview', icon: <Heart />, path: '/patient/dashboard' },
        { id: 'experts', label: 'Health Experts', icon: <Users />, path: '/patient/dashboard' },
        { id: 'trials', label: 'Clinical Trials', icon: <FileText />, path: '/patient/dashboard' },
        { id: 'publications', label: 'Publications', icon: <BookOpen />, path: '/publications' },
        { id: 'forums', label: 'Forums', icon: <MessageCircle />, path: '/patient/dashboard' },
        { id: 'favorites', label: 'My Favorites', icon: <Star />, path: '/patient/dashboard' },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: <Heart />, path: '/researcher/dashboard' },
        { id: 'trials', label: 'Clinical Trials', icon: <FileText />, path: '/researcher/dashboard' },
        { id: 'publications', label: 'Publications', icon: <BookOpen />, path: '/publications' },
        { id: 'forums', label: 'Forums', icon: <MessageCircle />, path: '/researcher/dashboard' },
        { id: 'favorites', label: 'My Favorites', icon: <Star />, path: '/researcher/dashboard' },
      ];

  const performSearch = useCallback(async (query) => {
    const searchTerm = query || searchQuery;

    if (!searchTerm.trim() || searchTerm.trim().length < 3) {
      setError('Please enter at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { publications: results } = await publicationService.searchPublications(searchTerm);
      setPublications(results || []);

      if (results.length === 0) {
        setError('No publications found. Try different keywords.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search publications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    await performSearch();
  }, [performSearch]);

  const handleSaveToggle = async (pmid) => {
    try {
      if (savedPmids.has(pmid)) {
        await publicationService.unsavePublication(pmid);
        setSavedPmids(prev => {
          const newSet = new Set(prev);
          newSet.delete(pmid);
          return newSet;
        });
      } else {
        await publicationService.savePublication(pmid);
        setSavedPmids(prev => new Set(prev).add(pmid));
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-screen overflow-y-auto flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center mb-4">
            <img src={logo} alt="CuraLink" className="h-16" />
          </div>
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
            <p className="text-xs text-gray-600">
              {userProfile?.role === 'patient' ? userProfile?.condition : 'Researcher'}
            </p>
          </div>
        </div>

        <nav className="p-4 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.path !== '/publications') {
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                item.id === 'publications'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t flex-shrink-0">
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
      <div className="flex-1 overflow-auto ml-64">
        <div className="py-8 px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Publications</h1>
              <p className="text-gray-600">
                Search for relevant medical research papers with AI-generated summaries
                {userProfile?.role === 'patient' && userProfile?.condition !== 'Not specified' && (
                  <span className="ml-2 text-sm text-primary-600">
                    • Showing results for: {userProfile?.condition}
                  </span>
                )}
              </p>
            </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords (e.g., lung cancer immunotherapy)"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Searching publications...</span>
          </div>
        )}

        {/* Results */}
        {!loading && publications.length > 0 && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Found {publications.length} publication{publications.length !== 1 ? 's' : ''}
            </div>

            <div className="space-y-4">
              {publications.map((pub) => (
                <div key={pub.pmid} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{pub.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Book className="w-4 h-4" />
                          {pub.journal}
                        </span>
                        <span>•</span>
                        <span>{pub.year}</span>
                        <span>•</span>
                        <span className="text-xs text-gray-500">PMID: {pub.pmid}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{pub.authors}</p>
                    </div>
                    <button
                      onClick={() => handleSaveToggle(pub.pmid)}
                      className="ml-4 text-yellow-500 hover:text-yellow-600"
                    >
                      {savedPmids.has(pub.pmid) ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <BookmarkPlus className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* AI Summary */}
                  {pub.aiSummary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 text-xs font-semibold uppercase">AI Summary</span>
                      </div>
                      <p className="text-sm text-blue-900 mt-2">{pub.aiSummary}</p>
                    </div>
                  )}

                  {/* Abstract Preview */}
                  {pub.abstract && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 line-clamp-3">{pub.abstract}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <a
                      href={pub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Read Full Paper
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {pub.doi && (
                      <span className="text-xs text-gray-500">DOI: {pub.doi}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && publications.length === 0 && searchQuery === '' && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Search Medical Literature</h3>
            <p className="text-gray-500">Enter keywords to find relevant research publications</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publications;
