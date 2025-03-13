import React from 'react';
import { SvgProps } from 'react-native-svg';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { Icons, IconName } from '@/lib/icons';

interface IconProps extends Omit<SvgProps, 'color'> {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style,
  ...props 
}) => {
  const icon = Icons[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found in registry`);
    return null;
  }

  const IconComponent = icon.component;
  if (typeof IconComponent !== 'function') {
    console.warn(`Invalid icon component for "${name}"`);
    return null;
  }

  return (
    <IconComponent 
      width={size} 
      height={size} 
      style={style}
      color={color as string}
      {...props}
    />
  );
}; 