import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-cyan text-base hover:bg-cyan/90 shadow-glow-sm font-semibold',
  secondary:
    'bg-panel text-ink-1 border border-line-hi hover:border-cyan/40 hover:text-cyan',
  ghost: 'text-ink-2 hover:text-ink-1 hover:bg-white/5',
  danger: 'bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25',
  outline: 'border border-line-hi text-ink-1 hover:border-cyan/50 hover:text-cyan bg-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', className = '', loading, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
        {...rest}
      >
        {loading && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
