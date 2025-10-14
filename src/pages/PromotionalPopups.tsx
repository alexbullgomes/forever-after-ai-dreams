import { useState } from 'react';
import { usePromotionalPopupAdmin } from '@/hooks/usePromotionalPopupAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PromotionalPopupForm from '@/components/admin/PromotionalPopupForm';
import { Database } from '@/integrations/supabase/types';

type PromotionalPopup = Database['public']['Tables']['promotional_popups']['Row'];

const PromotionalPopups = () => {
  const { popups, loading, deletePopup, toggleActive } = usePromotionalPopupAdmin();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PromotionalPopup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [popupToDelete, setPopupToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingPopup(null);
    setIsFormOpen(true);
  };

  const handleEdit = (popup: PromotionalPopup) => {
    setEditingPopup(popup);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setPopupToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (popupToDelete) {
      await deletePopup(popupToDelete);
      setDeleteDialogOpen(false);
      setPopupToDelete(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotional Pop-Ups</h1>
          <p className="text-gray-600 mt-1">Manage promotional discount pop-ups for your website</p>
        </div>
        <Button onClick={handleCreate} className="bg-gradient-to-r from-rose-500 to-pink-500">
          <Plus className="mr-2 h-4 w-4" />
          Create Pop-Up
        </Button>
      </div>

      {popups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No promotional pop-ups created yet</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Pop-Up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popups.map((popup) => (
            <Card key={popup.id} className={popup.is_active ? 'ring-2 ring-rose-500' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{popup.title}</CardTitle>
                    {popup.subtitle && (
                      <CardDescription className="mt-1">{popup.subtitle}</CardDescription>
                    )}
                  </div>
                  {popup.is_active && (
                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">{popup.discount_label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CTA:</span>
                    <span className="font-medium">{popup.cta_label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delay:</span>
                    <span className="font-medium">{popup.delay_seconds}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Countdown:</span>
                    <span className="font-medium">{popup.countdown_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="font-medium">{formatDate(popup.start_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="font-medium">{formatDate(popup.end_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(popup.id, popup.is_active)}
                    className="flex-1"
                  >
                    {popup.is_active ? (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(popup)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(popup.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PromotionalPopupForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPopup(null);
        }}
        popup={editingPopup}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotional Pop-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pop-up? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromotionalPopups;
