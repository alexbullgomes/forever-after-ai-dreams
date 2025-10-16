import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

// Convert HSL string "244 63 94" to hex
const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(Number);
  const hDecimal = l / 100;
  const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Convert hex to HSL string "244 63 94"
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0 0";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s} ${l}`;
};

export const ColorPicker = ({ label, value, onChange, description }: ColorPickerProps) => {
  const hexValue = hslToHex(value);
  const [h, s, l] = value.split(' ').map(Number);

  const handleHexChange = (hex: string) => {
    onChange(hexToHsl(hex));
  };

  const handleHslChange = (component: 'h' | 's' | 'l', newValue: number) => {
    const [currentH, currentS, currentL] = value.split(' ').map(Number);
    let newH = currentH, newS = currentS, newL = currentL;
    
    if (component === 'h') newH = Math.max(0, Math.min(360, newValue));
    if (component === 's') newS = Math.max(0, Math.min(100, newValue));
    if (component === 'l') newL = Math.max(0, Math.min(100, newValue));
    
    onChange(`${newH} ${newS} ${newL}`);
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-md border-2 border-border shadow-sm cursor-pointer"
          style={{ backgroundColor: hexValue }}
          onClick={() => document.getElementById(`hex-${label}`)?.focus()}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`hex-${label}`} className="text-xs w-12">Hex:</Label>
            <Input
              id={`hex-${label}`}
              type="color"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-20 h-8 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              className="flex-1 h-8 font-mono text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs w-12">H:</Label>
          <Input
            type="number"
            min="0"
            max="360"
            value={h}
            onChange={(e) => handleHslChange('h', parseInt(e.target.value) || 0)}
            className="flex-1 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground w-8">°</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs w-12">S:</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={s}
            onChange={(e) => handleHslChange('s', parseInt(e.target.value) || 0)}
            className="flex-1 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground w-8">%</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs w-12">L:</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={l}
            onChange={(e) => handleHslChange('l', parseInt(e.target.value) || 0)}
            className="flex-1 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground w-8">%</span>
        </div>
      </div>
    </Card>
  );
};
