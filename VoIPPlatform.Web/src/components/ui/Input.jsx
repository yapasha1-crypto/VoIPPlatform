const Input = ({
  label,
  error,
  className = '',
  type = 'text',
  required = false,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`
          px-4 py-2.5
          bg-slate-900
          border rounded-lg
          text-slate-100
          placeholder-slate-500
          focus:outline-none
          focus:ring-2
          focus:ring-violet-600
          focus:border-transparent
          transition-all
          ${error ? 'border-red-500' : 'border-slate-700'}
        `}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-400">{error}</span>
      )}
    </div>
  );
};

export default Input;
