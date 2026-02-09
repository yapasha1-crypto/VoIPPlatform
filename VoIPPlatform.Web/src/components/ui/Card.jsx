const Card = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`bg-slate-800 rounded-xl shadow-xl border border-slate-700 ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-700">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
