import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAvailabilityOverrides, AvailabilityOverride } from '@/hooks/useAvailabilityOverrides';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface AvailabilityOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  existingOverride?: AvailabilityOverride | null;
  onSaved?: () => void;
}

export const AvailabilityOverrideModal: React.FC<AvailabilityOverrideModalProps> = ({
  isOpen,
  onClose,
  date,
  existingOverride,
  onSaved,
}) => {
  const { createOverride, updateOverride, deleteOverride } = useAvailabilityOverrides();
  
  const [applyToWholeDay, setApplyToWholeDay] = useState(true);
  const [status, setStatus] = useState<'available' | 'limited' | 'full' | 'blocked'>('blocked');
  const [capacityOverride, setCapacityOverride] = useState<string>('');
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingOverride) {
      setStatus(existingOverride.status);
      setCapacityOverride(existingOverride.capacity_override?.toString() || '');
      setReason(existingOverride.reason || '');
      setApplyToWholeDay(!!existingOverride.date);
      if (existingOverride.start_at) {
        setStartTime(format(new Date(existingOverride.start_at), 'HH:mm'));
      }
      if (existingOverride.end_at) {
        setEndTime(format(new Date(existingOverride.end_at), 'HH:mm'));
      }
    } else {
      // Reset form
      setStatus('blocked');
      setCapacityOverride('');
      setReason('');
      setApplyToWholeDay(true);
      setStartTime('10:00');
      setEndTime('18:00');
    }
  }, [existingOverride, isOpen]);

  const handleSave = async () => {
    if (!date) return;

    setSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const overrideData = {
        product_id: null, // Always use global overrides
        status,
        capacity_override: capacityOverride ? parseInt(capacityOverride) : null,
        reason: reason || null,
        date: applyToWholeDay ? dateStr : null,
        start_at: !applyToWholeDay ? `${dateStr}T${startTime}:00Z` : null,
        end_at: !applyToWholeDay ? `${dateStr}T${endTime}:00Z` : null,
      };

      if (existingOverride) {
        await updateOverride(existingOverride.id, overrideData);
      } else {
        await createOverride(overrideData);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error saving override:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingOverride) return;
    
    setSaving(true);
    try {
      await deleteOverride(existingOverride.id);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error deleting override:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingOverride ? 'Edit Override' : 'Create Override'}
            {date && ` - ${format(date, 'MMM d, yyyy')}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whole-day">Apply to whole day</Label>
            <Switch
              id="whole-day"
              checked={applyToWholeDay}
              onCheckedChange={setApplyToWholeDay}
            />
          </div>

          {!applyToWholeDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity Override (optional)</Label>
            <Input
              id="capacity"
              type="number"
              min="0"
              placeholder="Leave empty for default"
              value={capacityOverride}
              onChange={(e) => setCapacityOverride(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Holiday, Special event, Maintenance"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingOverride && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={saving}
                className="text-destructive hover:text-destructive"
                title="Remove override and revert to default rule-based availability"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
