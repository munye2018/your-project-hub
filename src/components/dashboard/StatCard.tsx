import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    primary: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    success: {
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    warning: {
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    accent: {
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-lg', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <span
                  className={cn(
                    'font-medium',
                    trend.value >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', styles.iconBg)}>
            <Icon className={cn('h-6 w-6', styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
