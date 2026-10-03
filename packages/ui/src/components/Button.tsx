import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  pill?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      pill = true,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#04564f] hover:bg-[#03453f] text-white shadow-sm hover:shadow-md focus-visible:ring-[#04564f]',
      secondary:
        'bg-white hover:bg-zinc-50 text-gray-900 border border-zinc-200 hover:border-zinc-300 shadow-sm focus-visible:ring-zinc-400',
      outline:
        'bg-transparent hover:bg-[#04564f] hover:text-white text-[#04564f] border border-[#04564f] focus-visible:ring-[#04564f]',
      dark:
        'bg-[#04564f] hover:bg-[#03453f] text-white shadow-sm focus-visible:ring-[#04564f]',
      ghost:
        'bg-transparent hover:bg-zinc-100 text-gray-700 hover:text-gray-900 focus-visible:ring-gray-400',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-600'
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-5 py-2.5 gap-2 h-10',
      lg: 'text-base px-7 py-3.5 gap-2.5 h-12 font-semibold',
      icon: 'p-2 h-10 w-10 shrink-0'
    };

    const shape = pill ? 'rounded-full' : 'rounded-lg';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], shape, className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 mr-2 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
