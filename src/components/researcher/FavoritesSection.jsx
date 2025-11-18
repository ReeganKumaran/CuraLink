import { FileText, Book, Users, ExternalLink } from 'lucide-react';

const ResearcherFavoritesSection = ({
  savedTrials = [],
  savedPublications = [],
  savedCollaborators = [],
  onOpenTrial,
  onOpenPublication,
  onOpenCollaborator
}) => {
  const allItems = [
    ...savedTrials.map(trial => ({
      id: `trial-${trial.id}`,
      type: 'Trial',
      icon: <FileText className="w-4 h-4" />,
      label: trial.title,
      note: trial.status || 'Clinical Trial',
      data: trial,
      onClick: () => onOpenTrial && onOpenTrial(trial)
    })),
    ...savedPublications.map(pub => ({
      id: `pub-${pub.pmid}`,
      type: 'Publication',
      icon: <Book className="w-4 h-4" />,
      label: pub.title,
      note: `${pub.journal} • ${pub.year}`,
      data: pub,
      link: pub.link,
      onClick: null
    })),
    ...savedCollaborators.map(collab => ({
      id: `collab-${collab.id || collab.userId}`,
      type: 'Collaborator',
      icon: <Users className="w-4 h-4" />,
      label: collab.name,
      note: collab.institution || collab.specialties || 'Collaborator',
      data: collab,
      onClick: () => onOpenCollaborator && onOpenCollaborator(collab)
    }))
  ];

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Saved Items</h3>

      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No Saved Items</h4>
          <p className="text-gray-500">
            Save trials, publications, or collaborators to access them quickly here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-gray-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 text-gray-500">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.type} {item.note && `• ${item.note}`}
                  </p>
                </div>
              </div>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium ml-4"
                >
                  Open
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={item.onClick}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium ml-4"
                >
                  Open
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearcherFavoritesSection;

