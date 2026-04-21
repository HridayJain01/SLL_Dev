export default function AdminOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>
      <p className="text-gray-500 mb-8">System metrics and quick actions will be displayed here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Active Memberships</p>
          <p className="text-3xl font-bold text-gray-900">8</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Books</p>
          <p className="text-3xl font-bold text-gray-900">45</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Books Out</p>
          <p className="text-3xl font-bold text-gray-900">14</p>
        </div>
      </div>
    </div>
  );
}
