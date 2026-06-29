interface IconProps {
  name: string;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Material Symbols ikonkasi. */
export function Icon({ name, fill, className = '', style }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`} style={style}>
      {name}
    </span>
  );
}
