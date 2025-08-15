import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange?: (value: string) => void;
}

function RadioGroup({ className, value, onValueChange, children, ...props }: RadioGroupProps) {
  return (
    <div className={cn('flex gap-2', className)} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          checked: child.props.value === value,
          onChange: () => onValueChange?.(child.props.value),
        });
      })}
    </div>
  );
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <input type="radio" ref={ref} className={cn('h-4 w-4', className)} {...props} />
  )
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
