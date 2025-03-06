import { SvgProps } from 'react-native-svg';
import HomeActiveIcon from './ui/Home-active.svg';
import HomeInactiveIcon from './ui/Home-inactive.svg';
import QueueActiveIcon from './ui/Queue-active.svg';
import QueueInactiveIcon from './ui/Queue-inactive.svg';
import SettingsActiveIcon from './ui/Settings-active.svg';
import SettingsInactiveIcon from './ui/Settings-inactive.svg';

// Define icon categories
export type IconCategory = 'ui' | 'action';

// Define icon types
export type IconType = {
  component: React.FC<SvgProps>;
  category: IconCategory;
  name: string;
};

// Icon registry
export const Icons = {
  'home-active': {
    component: HomeActiveIcon,
    category: 'ui' as const,
    name: 'home-active',
  },
  'home-inactive': {
    component: HomeInactiveIcon,
    category: 'ui' as const,
    name: 'home-inactive',
  },
  'queue-active': {
    component: QueueActiveIcon,
    category: 'ui' as const,
    name: 'queue-active',
  },
  'queue-inactive': {
    component: QueueInactiveIcon,
    category: 'ui' as const,
    name: 'queue-inactive',
  },
  'settings-active': {
    component: SettingsActiveIcon,
    category: 'ui' as const,
    name: 'settings-active',
  },
  'settings-inactive': {
    component: SettingsInactiveIcon,
    category: 'ui' as const,
    name: 'settings-inactive',
  },
} as const;

// Type for icon names
export type IconName = keyof typeof Icons;

// Helper function to get icon by name
export const getIcon = (name: IconName): IconType => {
  return Icons[name];
};

// Helper function to get all icons by category
export const getIconsByCategory = (category: IconCategory): IconType[] => {
  return Object.values(Icons).filter(icon => icon.category === category);
}; 