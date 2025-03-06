declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  
  const SvgComponent: React.FC<SvgProps & { fill?: string }>;
  export default SvgComponent;
} 