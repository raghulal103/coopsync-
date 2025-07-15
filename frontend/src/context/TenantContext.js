import React, { createContext, useContext, useReducer, useEffect } from 'react';

const TenantContext = createContext();

const tenantReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TENANT':
      return {
        ...state,
        current: action.payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'CLEAR_TENANT':
      return {
        ...state,
        current: null,
        loading: false
      };
    default:
      return state;
  }
};

const initialState = {
  current: null,
  loading: true
};

export const TenantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);

  useEffect(() => {
    // Get tenant from subdomain or localStorage
    const getTenant = () => {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        return {
          id: subdomain,
          name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Cooperative',
          type: 'cooperative',
          settings: {
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY'
          }
        };
      }
      
      // Fallback to localStorage or default
      const storedTenant = localStorage.getItem('tenant');
      if (storedTenant) {
        return JSON.parse(storedTenant);
      }
      
      return {
        id: 'default',
        name: 'Demo Cooperative Society',
        type: 'cooperative',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY'
        }
      };
    };

    const tenant = getTenant();
    dispatch({ type: 'SET_TENANT', payload: tenant });
    localStorage.setItem('tenant', JSON.stringify(tenant));
  }, []);

  const setTenant = (tenant) => {
    dispatch({ type: 'SET_TENANT', payload: tenant });
    localStorage.setItem('tenant', JSON.stringify(tenant));
  };

  const clearTenant = () => {
    dispatch({ type: 'CLEAR_TENANT' });
    localStorage.removeItem('tenant');
  };

  const value = {
    ...state,
    setTenant,
    clearTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};