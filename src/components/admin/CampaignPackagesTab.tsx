 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { useCampaignPackages, CampaignPackage } from "@/hooks/useCampaignPackages";
 import { useToast } from "@/hooks/use-toast";
 import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign, Star, Eye, EyeOff, AlertCircle } from "lucide-react";
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
 
 interface CampaignPackagesTabProps {
   campaignId: string | undefined;
   pricingSectionEnabled: boolean;
   onPricingSectionToggle: (enabled: boolean) => void;
 }
 
 interface PackageFormData {
   title: string;
   price_display: string;
   description: string;
   features: string[];
   ideal_for: string;
   is_popular: boolean;
   is_enabled: boolean;
   minimum_deposit_cents: number;
 }
 
 const defaultPackageData: PackageFormData = {
   title: '',
   price_display: '',
   description: '',
   features: [''],
   ideal_for: '',
   is_popular: false,
   is_enabled: true,
   minimum_deposit_cents: 15000, // $150 default
 };
 
 export function CampaignPackagesTab({ 
   campaignId, 
   pricingSectionEnabled, 
   onPricingSectionToggle 
 }: CampaignPackagesTabProps) {
   const { toast } = useToast();
   const { packages, isLoading, createPackage, updatePackage, deletePackage } = useCampaignPackages(campaignId);
   
   const [expandedId, setExpandedId] = useState<string | null>(null);
   const [isAddingNew, setIsAddingNew] = useState(false);
   const [newPackageData, setNewPackageData] = useState<PackageFormData>(defaultPackageData);
   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
   const [editFormData, setEditFormData] = useState<Record<string, PackageFormData>>({});
 
   const validatePackage = (pkg: PackageFormData): string[] => {
     const errors: string[] = [];
     if (!pkg.title.trim()) errors.push('Title is required');
     if (!pkg.price_display.trim()) errors.push('Marketing price is required');
     if (pkg.is_enabled && (!pkg.minimum_deposit_cents || pkg.minimum_deposit_cents < 100)) {
       errors.push('Enabled packages must have a minimum booking value of at least $1');
     }
     return errors;
   };
 
   const handleCreatePackage = async () => {
     if (!campaignId) {
       toast({ title: "Error", description: "Please save the campaign first", variant: "destructive" });
       return;
     }
 
     const errors = validatePackage(newPackageData);
     if (errors.length > 0) {
       toast({ title: "Validation Error", description: errors.join(', '), variant: "destructive" });
       return;
     }
 
     await createPackage.mutateAsync({
       campaign_id: campaignId,
       title: newPackageData.title.trim(),
       price_display: newPackageData.price_display.trim(),
       description: newPackageData.description.trim() || undefined,
       features: newPackageData.features.filter(f => f.trim()),
       ideal_for: newPackageData.ideal_for.trim() || undefined,
       is_popular: newPackageData.is_popular,
       is_enabled: newPackageData.is_enabled,
       minimum_deposit_cents: newPackageData.minimum_deposit_cents,
       sort_order: packages.length,
     });
 
     setNewPackageData(defaultPackageData);
     setIsAddingNew(false);
   };
 
   const handleUpdatePackage = async (pkgId: string) => {
     const formData = editFormData[pkgId];
     if (!formData) return;
 
     const errors = validatePackage(formData);
     if (errors.length > 0) {
       toast({ title: "Validation Error", description: errors.join(', '), variant: "destructive" });
       return;
     }
 
     await updatePackage.mutateAsync({
       id: pkgId,
       title: formData.title.trim(),
       price_display: formData.price_display.trim(),
       description: formData.description.trim() || null,
       features: formData.features.filter(f => f.trim()),
       ideal_for: formData.ideal_for.trim() || null,
       is_popular: formData.is_popular,
       is_enabled: formData.is_enabled,
       minimum_deposit_cents: formData.minimum_deposit_cents,
     });
 
     setExpandedId(null);
     setEditFormData(prev => {
       const next = { ...prev };
       delete next[pkgId];
       return next;
     });
   };
 
   const handleDeletePackage = async (pkgId: string) => {
     await deletePackage.mutateAsync(pkgId);
     setDeleteConfirmId(null);
   };
 
   const handleToggleEnabled = async (pkg: CampaignPackage) => {
     await updatePackage.mutateAsync({
       id: pkg.id,
       is_enabled: !pkg.is_enabled,
     });
   };
 
   const startEditing = (pkg: CampaignPackage) => {
     setEditFormData(prev => ({
       ...prev,
       [pkg.id]: {
         title: pkg.title,
         price_display: pkg.price_display,
         description: pkg.description || '',
         features: pkg.features.length > 0 ? pkg.features : [''],
         ideal_for: pkg.ideal_for || '',
         is_popular: pkg.is_popular,
         is_enabled: pkg.is_enabled,
         minimum_deposit_cents: pkg.minimum_deposit_cents,
       },
     }));
     setExpandedId(pkg.id);
   };
 
   const cancelEditing = (pkgId: string) => {
     setExpandedId(null);
     setEditFormData(prev => {
       const next = { ...prev };
       delete next[pkgId];
       return next;
     });
   };
 
   const updateEditField = (pkgId: string, field: keyof PackageFormData, value: any) => {
     setEditFormData(prev => ({
       ...prev,
       [pkgId]: {
         ...prev[pkgId],
         [field]: value,
       },
     }));
   };
 
   const updateNewField = (field: keyof PackageFormData, value: any) => {
     setNewPackageData(prev => ({ ...prev, [field]: value }));
   };
 
   const addFeature = (pkgId: string | null) => {
     if (pkgId) {
       const current = editFormData[pkgId]?.features || [];
       updateEditField(pkgId, 'features', [...current, '']);
     } else {
       setNewPackageData(prev => ({ ...prev, features: [...prev.features, ''] }));
     }
   };
 
   const removeFeature = (pkgId: string | null, index: number) => {
     if (pkgId) {
       const current = editFormData[pkgId]?.features || [];
       updateEditField(pkgId, 'features', current.filter((_, i) => i !== index));
     } else {
       setNewPackageData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
     }
   };
 
   const updateFeatureText = (pkgId: string | null, index: number, text: string) => {
     if (pkgId) {
       const current = [...(editFormData[pkgId]?.features || [])];
       current[index] = text;
       updateEditField(pkgId, 'features', current);
     } else {
       setNewPackageData(prev => {
         const features = [...prev.features];
         features[index] = text;
         return { ...prev, features };
       });
     }
   };
 
   const renderPackageForm = (
     data: PackageFormData, 
     pkgId: string | null, 
     onSave: () => void, 
     onCancel: () => void
   ) => {
     const updateField = (field: keyof PackageFormData, value: any) => {
       if (pkgId) {
         updateEditField(pkgId, field, value);
       } else {
         updateNewField(field, value);
       }
     };
 
     return (
       <div className="space-y-4 pt-4 border-t">
         <div className="space-y-2">
           <Label htmlFor={`${pkgId || 'new'}-title`}>Package Title *</Label>
           <Input
             id={`${pkgId || 'new'}-title`}
             value={data.title}
             onChange={(e) => updateField('title', e.target.value)}
             placeholder="e.g., Brand Photography Content"
           />
         </div>
 
         <div className="space-y-2">
           <Label htmlFor={`${pkgId || 'new'}-price`}>Marketing Price (Display) *</Label>
           <Input
             id={`${pkgId || 'new'}-price`}
             value={data.price_display}
             onChange={(e) => updateField('price_display', e.target.value)}
             placeholder="e.g., Starting at $250 or Personalize"
           />
           <p className="text-xs text-muted-foreground">
             This is the price shown on the campaign card (marketing only).
           </p>
         </div>
 
         {/* NEW FIELD - Highlighted */}
         <div className="space-y-2 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
           <Label className="flex items-center gap-2">
             <DollarSign className="h-4 w-4 text-primary" />
             Minimum booking value to secure date *
           </Label>
           <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
             <Input
               type="number"
               min="1"
               step="1"
               className="pl-7"
               value={data.minimum_deposit_cents / 100}
               onChange={(e) => updateField('minimum_deposit_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
               placeholder="150"
             />
           </div>
           <p className="text-xs text-muted-foreground">
             This is the amount charged via Stripe to hold the booking date. 
             It appears in the booking modal and is independent of the marketing price above.
           </p>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor={`${pkgId || 'new'}-description`}>Description</Label>
           <Textarea
             id={`${pkgId || 'new'}-description`}
             value={data.description}
             onChange={(e) => updateField('description', e.target.value)}
             placeholder="Package description..."
             rows={2}
           />
         </div>
 
         <div className="space-y-2">
           <Label>Features</Label>
           {data.features.map((feature, idx) => (
             <div key={idx} className="flex gap-2">
               <Input
                 value={feature}
                 onChange={(e) => updateFeatureText(pkgId, idx, e.target.value)}
                 placeholder="Feature description"
               />
               <Button
                 type="button"
                 variant="ghost"
                 size="icon"
                 onClick={() => removeFeature(pkgId, idx)}
                 disabled={data.features.length <= 1}
               >
                 <Trash2 className="h-4 w-4" />
               </Button>
             </div>
           ))}
           <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={() => addFeature(pkgId)}
           >
             <Plus className="h-4 w-4 mr-1" />
             Add Feature
           </Button>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor={`${pkgId || 'new'}-ideal`}>Ideal For (optional)</Label>
           <Input
             id={`${pkgId || 'new'}-ideal`}
             value={data.ideal_for}
             onChange={(e) => updateField('ideal_for', e.target.value)}
             placeholder="e.g., Perfect for couples who want..."
           />
         </div>
 
         <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Switch
               checked={data.is_popular}
               onCheckedChange={(checked) => updateField('is_popular', checked)}
             />
             <Label className="flex items-center gap-1">
               <Star className="h-4 w-4" />
               Mark as Popular
             </Label>
           </div>
           <div className="flex items-center gap-2">
             <Switch
               checked={data.is_enabled}
               onCheckedChange={(checked) => updateField('is_enabled', checked)}
             />
             <Label className="flex items-center gap-1">
               {data.is_enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
               {data.is_enabled ? 'Enabled' : 'Disabled'}
             </Label>
           </div>
         </div>
 
         <div className="flex justify-between pt-2">
           <Button type="button" variant="ghost" onClick={onCancel}>
             Cancel
           </Button>
           <Button 
             type="button" 
             onClick={onSave}
             disabled={createPackage.isPending || updatePackage.isPending}
           >
             {pkgId ? 'Save Changes' : 'Create Package'}
           </Button>
         </div>
       </div>
     );
   };
 
   if (!campaignId) {
     return (
       <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border text-muted-foreground">
         <AlertCircle className="h-5 w-5" />
         <p>Save the campaign first to manage packages.</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Master section toggle */}
       <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
         <div>
           <Label htmlFor="pricing_section_enabled" className="text-base font-medium">
             Show Promotional Packages Section
           </Label>
           <p className="text-sm text-muted-foreground mt-1">
             Toggle to show or hide the entire packages section on the campaign page
           </p>
         </div>
         <Switch
           id="pricing_section_enabled"
           checked={pricingSectionEnabled}
           onCheckedChange={onPricingSectionToggle}
         />
       </div>
 
       {/* Packages list */}
       <div className={pricingSectionEnabled ? '' : 'opacity-50 pointer-events-none'}>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between">
             <CardTitle>Campaign Packages</CardTitle>
             {!isAddingNew && (
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={() => setIsAddingNew(true)}
               >
                 <Plus className="h-4 w-4 mr-1" />
                 Add Package
               </Button>
             )}
           </CardHeader>
           <CardContent className="space-y-4">
             {isLoading ? (
               <p className="text-muted-foreground">Loading packages...</p>
             ) : packages.length === 0 && !isAddingNew ? (
               <div className="text-center py-8 text-muted-foreground">
                 <p>No packages yet. Create your first package to get started.</p>
                 <Button
                   type="button"
                   variant="outline"
                   className="mt-4"
                   onClick={() => setIsAddingNew(true)}
                 >
                   <Plus className="h-4 w-4 mr-1" />
                   Add Package
                 </Button>
               </div>
             ) : (
               <>
                 {/* Existing packages */}
                 {packages.map((pkg) => (
                   <div key={pkg.id} className="border rounded-lg p-4 space-y-3">
                     {/* Header */}
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className="font-semibold">{pkg.title}</span>
                         {pkg.is_popular && (
                           <Badge variant="default" className="bg-primary">
                             <Star className="h-3 w-3 mr-1" />
                             Popular
                           </Badge>
                         )}
                         {!pkg.is_enabled && (
                           <Badge variant="secondary">
                             <EyeOff className="h-3 w-3 mr-1" />
                             Disabled
                           </Badge>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                         <Switch
                           checked={pkg.is_enabled}
                           onCheckedChange={() => handleToggleEnabled(pkg)}
                           disabled={updatePackage.isPending}
                         />
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => expandedId === pkg.id ? cancelEditing(pkg.id) : startEditing(pkg)}
                         >
                           {expandedId === pkg.id ? (
                             <ChevronUp className="h-4 w-4" />
                           ) : (
                             <ChevronDown className="h-4 w-4" />
                           )}
                         </Button>
                       </div>
                     </div>
 
                     {/* Summary when collapsed */}
                     {expandedId !== pkg.id && (
                       <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                         <span>Marketing: <span className="font-medium text-foreground">{pkg.price_display}</span></span>
                         <span>|</span>
                         <span>Booking Hold: <span className="font-medium text-primary">${(pkg.minimum_deposit_cents / 100).toFixed(2)}</span></span>
                       </div>
                     )}
 
                     {/* Editor when expanded */}
                     {expandedId === pkg.id && editFormData[pkg.id] && (
                       <>
                         {renderPackageForm(
                           editFormData[pkg.id],
                           pkg.id,
                           () => handleUpdatePackage(pkg.id),
                           () => cancelEditing(pkg.id)
                         )}
                         <div className="pt-4 border-t">
                           <Button
                             type="button"
                             variant="destructive"
                             size="sm"
                             onClick={() => setDeleteConfirmId(pkg.id)}
                           >
                             <Trash2 className="h-4 w-4 mr-1" />
                             Delete Package
                           </Button>
                         </div>
                       </>
                     )}
                   </div>
                 ))}
 
                 {/* New package form */}
                 {isAddingNew && (
                   <div className="border-2 border-dashed border-primary/50 rounded-lg p-4">
                     <h4 className="font-semibold mb-2">New Package</h4>
                     {renderPackageForm(
                       newPackageData,
                       null,
                       handleCreatePackage,
                       () => {
                         setIsAddingNew(false);
                         setNewPackageData(defaultPackageData);
                       }
                     )}
                   </div>
                 )}
               </>
             )}
           </CardContent>
         </Card>
       </div>
 
       {/* Delete confirmation dialog */}
       <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Package</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete this package? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => deleteConfirmId && handleDeletePackage(deleteConfirmId)}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }