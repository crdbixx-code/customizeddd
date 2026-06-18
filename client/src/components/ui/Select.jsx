import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, className = '', children, id, ...rest }, ref) => {
  const selectId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-ink-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 outline-none transition-colors focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15 ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

export default Select;
