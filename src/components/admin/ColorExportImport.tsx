import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { BrandColors } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useRef } from "react";

interface ColorExportImportProps {
  colors: BrandColors;
  onImport: (colors: BrandColors) => void;
}

export const ColorExportImport = ({ colors, onImport }: ColorExportImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(colors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `everafter-brand-colors-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Colors Exported',
      description: 'Brand colors downloaded successfully'
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        // Validate structure
        if (!imported.primary_from || !imported.primary_to || 
            !imported.primary_hover_from || !imported.primary_hover_to) {
          throw new Error('Invalid color format');
        }

        // Validate HSL format (should be "H S L")
        const hslRegex = /^\d{1,3} \d{1,3} \d{1,3}$/;
        if (!hslRegex.test(imported.primary_from) || 
            !hslRegex.test(imported.primary_to) ||
            !hslRegex.test(imported.primary_hover_from) || 
            !hslRegex.test(imported.primary_hover_to)) {
          throw new Error('Invalid HSL format');
        }

        onImport(imported);
        toast({
          title: 'Colors Imported',
          description: 'Brand colors imported successfully'
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Invalid color configuration file',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export Colors
      </Button>
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        variant="outline" 
        size="sm"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import Colors
      </Button>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
};
