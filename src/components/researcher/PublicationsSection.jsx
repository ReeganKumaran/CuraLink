import { Book, ExternalLink, BookmarkCheck, BookmarkPlus, Loader, Search } from 'lucide-react';

const ResearcherPublicationsSection = ({
  publications,
  savedPmids = new Set(),
  onSaveToggle,
  onSearch,
  searchQuery,
  onSearchChange,
  loading,
  error
}) => {
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">My Publications</h3>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search publications by keywords..."
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
          <span className="ml-3 text-gray-600">Loading publications...</span>
        </div>
      )}

      {/* Publications List */}
      {!loading && publications && publications.length > 0 && (
        <div className="space-y-4">
          {publications.map((publication) => (
            <div key={publication.pmid || publication.id} className="border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{publication.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Book className="w-4 h-4" />
                      {publication.journal}
                    </span>
                    <span>•</span>
                    <span>{publication.year}</span>
                    {publication.pmid && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-gray-500">PMID: {publication.pmid}</span>
                      </>
                    )}
                  </div>
                  {publication.authors && (
                    <p className="text-sm text-gray-700 mb-2">{publication.authors}</p>
                  )}
                </div>
                {onSaveToggle && publication.pmid && (
                  <button
                    onClick={() => onSaveToggle(publication.pmid)}
                    className="ml-4 text-yellow-500 hover:text-yellow-600"
                    title={savedPmids.has(publication.pmid) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {savedPmids.has(publication.pmid) ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <BookmarkPlus className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              {/* AI Summary */}
              {publication.aiSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <span className="text-blue-600 text-xs font-semibold uppercase">AI Summary</span>
                  <p className="text-sm text-blue-900 mt-2">{publication.aiSummary}</p>
                </div>
              )}

              {/* Abstract Preview */}
              {publication.abstract && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 line-clamp-3">{publication.abstract}</p>
                </div>
              )}

              {/* Notes (for saved publications) */}
              {publication.notes && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-xs font-semibold text-yellow-700 uppercase">My Notes</span>
                  <p className="text-sm text-yellow-900 mt-1">{publication.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {publication.link && (
                  <a
                    href={publication.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Read Full Paper
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {publication.doi && (
                  <span className="text-xs text-gray-500">DOI: {publication.doi}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && (!publications || publications.length === 0) && !error && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No Publications Found</h4>
          <p className="text-gray-500">
            {searchQuery ? 'Try different keywords or search terms' : 'Search for publications to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResearcherPublicationsSection;

