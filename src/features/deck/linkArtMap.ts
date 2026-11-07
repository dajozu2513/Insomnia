import type { ComponentType } from 'react';

import type { MotifProps } from '../motifs/MotifSvg';
import {
  EchoLink,
  HeartLink,
  MeridianLink,
  MonolithLink,
  SnakeLink,
  StarLink,
  StaticLink,
  TogetherLink,
  VoidLink,
} from './linkArt';

/** Illustration per link id (src/data/links.ts). A new link needs an entry here. */
export const LINK_ART: Readonly<Record<string, ComponentType<MotifProps>>> = {
  void: VoidLink,
  star: StarLink,
  monolith: MonolithLink,
  static: StaticLink,
  together: TogetherLink,
  meridian: MeridianLink,
  heart: HeartLink,
  echo: EchoLink,
  snake: SnakeLink,
};
