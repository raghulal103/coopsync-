import React from 'react';
import { useTenant } from '../../context/TenantContext';

const AuthLayout = ({ children }) => {
  const { current: tenant } = useTenant();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {tenant?.name || 'Cooperative ERP'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enterprise Resource Planning for Cooperative Societies
          </p>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;