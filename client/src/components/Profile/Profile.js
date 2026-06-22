import React from 'react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Management Module</h3>
          <p className="text-gray-500">
            This module will include profile settings, password changes, and account preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
