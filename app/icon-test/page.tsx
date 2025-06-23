'use client';

import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Chip } from '@/src/components/ui/Chip';
import { Tag } from '@/src/components/ui/Tag';
import { Star, Heart, Settings, Check, AlertCircle, Info, TrendingUp, User, Rocket, ArrowRight } from 'lucide-react';

export default function IconTestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-normal mb-8">Icon Props Test</h1>
      
      <div>
        <h2 className="text-lg font-normal mb-4">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<Rocket />}>Left Icon</Button>
          <Button rightIcon={<ArrowRight />}>Right Icon</Button>
          <Button leftIcon={<Star />} rightIcon={<ArrowRight />}>Both Icons</Button>
          <Button size="compact" leftIcon={<Heart />} />
          <Button theme="danger" leftIcon={<AlertCircle />}>Danger</Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-normal mb-4">Badges with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Badge icon={<Star />}>Left Icon</Badge>
          <Badge icon={<Star />} iconPosition="right">Right Icon</Badge>
          <Badge icon={<Star />} closable onClose={() => alert('closed')}>Closable</Badge>
          <Badge icon={<Info />} color="info">Info Badge</Badge>
          <Badge icon={<Check />} color="success" variant="soft">Success</Badge>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-normal mb-4">Chips with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Chip icon={<User />}>User Chip</Chip>
          <Chip icon={<TrendingUp />} selected>Selected</Chip>
          <Chip icon={<Settings />} variant="fancy">Fancy</Chip>
          <Chip icon={<Star />} onRemove={() => alert('removed')}>Removable</Chip>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-normal mb-4">Tags with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Tag icon={<Info />}>Info Tag</Tag>
          <Tag icon={<Check />} variant="success">Success</Tag>
          <Tag icon={<AlertCircle />} variant="warning">Warning</Tag>
          <Tag icon={<User />} onRemove={() => alert('removed')}>Removable</Tag>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-normal mb-4">Button Press States</h2>
        <p className="text-sm text-gray-600 mb-4">Click and hold to see the pressed state with deeper inner shadow</p>
        <div className="flex flex-wrap gap-4">
          <Button theme="primary">Primary</Button>
          <Button theme="danger">Danger</Button>
          <Button theme="warning">Warning</Button>
          <Button theme="info">Info</Button>
          <Button theme="dark">Dark</Button>
        </div>
      </div>
    </div>
  );
}