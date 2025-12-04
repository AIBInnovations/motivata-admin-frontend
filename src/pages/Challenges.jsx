import { Trophy } from 'lucide-react';

function Challenges() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challenges</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage challenges
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Challenges</h3>
        <p className="mt-2 text-sm text-gray-500">
          Challenge management coming soon
        </p>
      </div>
    </div>
  );
}

export default Challenges;
