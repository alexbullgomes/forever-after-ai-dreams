'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  rectIntersection,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter,
  pointerWithin,
  getFirstCollision,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useState } from 'react';

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

export type KanbanBoardProps = {
  id: Status['id'];
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ 
    id,
    data: { type: 'column' }
  });

  return (
    <div
      className={cn(
        'flex h-full min-h-40 flex-col gap-2 rounded-md border bg-secondary p-2 text-xs shadow-sm outline outline-2 transition-all',
        isOver ? 'outline-primary' : 'outline-transparent',
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps = Pick<Feature, 'id' | 'name'> & {
  index: number;
  parent: string;
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = ({
  id,
  name,
  index,
  parent,
  children,
  className,
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { 
      type: 'card',
      index, 
      parent 
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md shadow-sm transition-all cursor-grab',
        isDragging && 'cursor-grabbing z-50',
        className
      )}
      {...attributes}
      {...listeners}
    >
      {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
    </Card>
  );
};

export type KanbanCardsProps = {
  children: ReactNode;
  className?: string;
  items: string[]; // Array of item IDs for sortable context
};

export const KanbanCards = ({ children, className, items }: KanbanCardsProps) => (
  <SortableContext items={items} strategy={verticalListSortingStrategy}>
    <div className={cn('flex flex-1 flex-col gap-2', className)}>
      {children}
    </div>
  </SortableContext>
);

export type KanbanHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: Status['name'];
      color: Status['color'];
      className?: string;
    };

export const KanbanHeader = (props: KanbanHeaderProps) =>
  'children' in props ? (
    props.children
  ) : (
    <div className={cn('flex shrink-0 items-center gap-2', props.className)}>
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: props.color }}
      />
      <p className="m-0 font-semibold text-sm">{props.name}</p>
    </div>
  );

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  className?: string;
};

// Custom collision detection for better drop zone detection
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  const centerCollisions = closestCenter(args);
  return centerCollisions;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  onDragOver,
  className,
}: KanbanProviderProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext 
      collisionDetection={customCollisionDetection}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={(event) => {
        setActiveId(null);
        onDragEnd(event);
      }}
      onDragOver={onDragOver}
    >
      <div
        className={cn('grid w-full auto-cols-fr grid-flow-col gap-4', className)}
      >
        {children}
      </div>
      <DragOverlay>
        {activeId ? (
          <Card className="rounded-md shadow-lg opacity-80 rotate-2 scale-105">
            <div className="p-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};