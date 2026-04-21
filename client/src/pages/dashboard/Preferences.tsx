export default function Preferences() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Preferences</h1>
      <p className="text-gray-500 mb-8">Books you've marked as preferences for future borrowing.</p>
      
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        Preference list is empty. Browse the library to add books!
      </div>
    </div>
  );
}
