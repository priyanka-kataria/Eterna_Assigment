import React from 'react';
import { OrderStatus } from '../types';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface OrderStatusStepperProps {
  status: OrderStatus;
}

const steps: { id: OrderStatus; label: string }[] = [
  { id: 'pending', label: 'Queued' },
  { id: 'routing', label: 'Routing' },
  { id: 'building', label: 'Building' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'confirmed', label: 'Confirmed' },
];

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ status }) => {
  const getStepState = (stepId: OrderStatus, currentStatus: OrderStatus) => {
    // Mapping status to an index order for comparison
    const orderMap: Record<string, number> = {
      idle: -1,
      pending: 0,
      routing: 1,
      building: 2,
      submitted: 3,
      confirmed: 4,
      failed: 99 // Failed is special
    };

    const currentIndex = orderMap[currentStatus];
    const stepIndex = orderMap[stepId];

    if (currentStatus === 'failed') {
      // If failed, everything before the failure point is done, but we don't know exactly where it failed easily without history.
      // For simplified view, show error if we are "past" pending.
      return 'error'; 
    }

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'waiting';
  };

  if (status === 'idle') return null;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded"></div>
        
        {steps.map((step, idx) => {
            const state = getStepState(step.id, status);
            const isLast = idx === steps.length - 1;

            let icon;
            let colorClass = '';
            
            if (status === 'failed' && step.id === 'submitted') {
                 // Simplified logic: Assuming failure happens during execution/submission usually
                 icon = <XCircle className="w-6 h-6 text-rose-500" />;
                 colorClass = 'text-rose-500';
            } else if (state === 'completed') {
                icon = <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-950" />;
                colorClass = 'text-emerald-400';
            } else if (state === 'active') {
                icon = <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
                colorClass = 'text-blue-400 animate-pulse';
            } else {
                icon = <Circle className="w-6 h-6 text-slate-700 fill-slate-900" />;
                colorClass = 'text-slate-600';
            }

            return (
                <div key={step.id} className="flex flex-col items-center bg-slate-900 px-2">
                    <div className="mb-2 bg-slate-900 rounded-full p-1">
                        {icon}
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>
                        {step.label}
                    </span>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;