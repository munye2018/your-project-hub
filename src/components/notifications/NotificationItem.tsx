import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Flame, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/opportunity';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

const typeConfig = {
  new_opportunity: {
    icon: TrendingUp,
    iconClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  price_drop: {
    icon: TrendingDown,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  high_value: {
    icon: Flame,
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
  },
  system: {
    icon: Info,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
  },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    if (notification.opportunity_id) {
      navigate(`/map?opportunity=${notification.opportunity_id}`);
      onClose?.();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          config.bgClass
        )}
      >
        <Icon className={cn('h-4 w-4', config.iconClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium leading-tight',
            !notification.is_read && 'text-foreground',
            notification.is_read && 'text-muted-foreground'
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={handleDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
