import 'react';

// Allow CSS custom properties in inline styles: style={{ '--i': 3 }}
declare module 'react' {
  // An interface (not a Record) is needed to merge into React's own declaration.
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
