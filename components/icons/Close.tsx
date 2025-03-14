import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const Close = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={props.color || "#0D0D0D"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Close; 