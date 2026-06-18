import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', id, ...rest }, ref) => {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`bg-surface border border-line-hi rounded-lg px-3.5 py-2.5 text-sm text-ink-1 placeholder:text-ink-4 outline-none transition-colors focus:border-cyan/60 focus:ring-2 focus:ring-cyan/15 ${
          error ? 'border-coral/60' : ''
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

export default Input;
