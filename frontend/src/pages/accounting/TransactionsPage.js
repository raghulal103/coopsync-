import React from 'react';
import { Helmet } from 'react-helmet-async';

const TransactionsPage = () => {
  return (
    <>
      <Helmet>
        <title>Transactions - Cooperative ERP</title>
      </Helmet>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Transactions</h1>
            <p className="text-gray-600 mb-6">This page is under development and will be available soon.</p>
            <div className="text-sm text-gray-500">
              <p>Features coming soon:</p>
              <ul className="mt-2 space-y-1">
                <li>• Modern user interface</li>
                <li>• Real-time data updates</li>
                <li>• Advanced filtering and search</li>
                <li>• Export and reporting capabilities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionsPage;
