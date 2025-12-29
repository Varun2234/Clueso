import React from 'react';

const Input = ({ 
  label, 
  name, 
  type = 'text', 
  error, 
  placeholder, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="text-sm font-semibold text-gray-700"
        >
          {label}
        </label>
      )}
      
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className={`
          px-3 py-2 rounded-lg border bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400
          ${error 
            ? 'border-red-500 focus:ring-2 focus:ring-red-100' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }
        `}
        {...props}
      />

      {/* Error Message Section */}
      {error && (
        <p className="text-xs font-medium text-red-500 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;