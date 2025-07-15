import React from 'react';
import { Link } from 'react-router-dom';

const VerifyEmailPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Page Under Development</h2>
          <p className="mt-2 text-sm text-gray-600">This page is coming soon</p>
        </div>
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <p className="text-center text-gray-500">Coming Soon</p>
          <div className="mt-6">
            <Link to="/auth/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
