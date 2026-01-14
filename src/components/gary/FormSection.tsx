import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight';
}

export const FormSection = ({ icon, title, children, className = '', variant = 'default' }: FormSectionProps) => (
  <div className={cn(
    "rounded-xl p-4 space-y-4",
    variant === 'highlight' 
      ? "bg-background" 
      : "bg-card border border-border",
    className
  )}>
    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
      <span className="w-1 h-4 bg-primary rounded-full" />
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

interface FormRowProps {
  label?: string;
  children: ReactNode;
  required?: boolean;
  horizontal?: boolean;
}

export const FormRow = ({ label, children, required, horizontal }: FormRowProps) => (
  <div className={horizontal ? "flex items-center gap-3" : "space-y-1.5"}>
    {label && (
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
    )}
    {horizontal ? <div className="flex-1 flex gap-3">{children}</div> : children}
  </div>
);
