import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { LandingCard } from '@/hooks/useLandingPageCards';

const ICON_OPTIONS = [
  'Heart', 'Camera', 'Sparkles', 'Video', 'Film', 'Star', 
  'Award', 'Gift', 'Music', 'Palette', 'Image', 'Users',
  'Calendar', 'Clock', 'MapPin', 'Zap', 'Shield', 'Trophy'
];

interface LandingCardEditorProps {
  card: LandingCard;
  index: number;
  onChange: (card: LandingCard) => void;
}

export const LandingCardEditor = ({ card, index, onChange }: LandingCardEditorProps) => {
  const [newFeature, setNewFeature] = useState('');

  const handleChange = <K extends keyof LandingCard>(key: K, value: LandingCard[K]) => {
    onChange({ ...card, [key]: value });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      handleChange('features', [...card.features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (featureIndex: number) => {
    handleChange('features', card.features.filter((_, i) => i !== featureIndex));
  };

  const updateFeature = (featureIndex: number, value: string) => {
    const newFeatures = [...card.features];
    newFeatures[featureIndex] = value;
    handleChange('features', newFeatures);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Card {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Icon Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={card.icon} onValueChange={(value) => handleChange('icon', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Button Label</Label>
            <Input
              value={card.button_label}
              onChange={(e) => handleChange('button_label', e.target.value)}
              placeholder="More Details"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={card.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Card title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={card.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Card description"
            rows={3}
          />
        </div>

        {/* Button Link (optional) */}
        <div className="space-y-2">
          <Label>Button Link (optional)</Label>
          <Input
            value={card.button_link}
            onChange={(e) => handleChange('button_link', e.target.value)}
            placeholder="/services or leave empty for default"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use default /services redirect after login
          </p>
        </div>

        {/* Features (Bullet Points) */}
        <div className="space-y-2">
          <Label>Features (Bullet Points)</Label>
          <div className="space-y-2">
            {card.features.map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(featureIndex, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(featureIndex)}
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add new feature"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addFeature}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
