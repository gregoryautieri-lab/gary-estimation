import { ReactNode } from 'react';

interface FormSectionProps {
  icon?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export const FormSection = ({ icon, title, children, className = '' }: FormSectionProps) => (
  <div className={`bg-card border border-border rounded-xl p-4 space-y-4 ${className}`}>
    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
      {icon && <span>{icon}</span>}
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
