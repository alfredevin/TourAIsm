import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { StepType } from '../../services/routing';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Turn arrows are one glyph rotated, so every direction shares the same weight.
const STEP_ICONS: Record<StepType, { icon: IoniconName; rotate: number }> = {
  straight: { icon: 'arrow-up', rotate: 0 },
  slightLeft: { icon: 'arrow-up', rotate: -45 },
  slightRight: { icon: 'arrow-up', rotate: 45 },
  keepLeft: { icon: 'arrow-up', rotate: -25 },
  keepRight: { icon: 'arrow-up', rotate: 25 },
  left: { icon: 'arrow-up', rotate: -90 },
  right: { icon: 'arrow-up', rotate: 90 },
  sharpLeft: { icon: 'arrow-up', rotate: -135 },
  sharpRight: { icon: 'arrow-up', rotate: 135 },
  uturn: { icon: 'arrow-undo', rotate: 0 },
  roundabout: { icon: 'sync', rotate: 0 },
  depart: { icon: 'navigate', rotate: 0 },
  arrive: { icon: 'flag', rotate: 0 },
};

type Props = {
  type: StepType;
  size: number;
  color: string;
};

export default function StepIcon({ type, size, color }: Props) {
  const { icon, rotate } = STEP_ICONS[type];
  return (
    <Ionicons
      name={icon}
      size={size}
      color={color}
      style={rotate !== 0 ? { transform: [{ rotate: `${rotate}deg` }] } : undefined}
    />
  );
}
