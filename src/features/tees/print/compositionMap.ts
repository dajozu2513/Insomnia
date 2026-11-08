import type { ComponentType } from 'react';

import type { CompositionId } from '../../../data/tees';
import {
  AltschmerzPrint,
  AnemoiaPrint,
  EnouementPrint,
  ExulansisPrint,
  LiberosisPrint,
  MonachopsisPrint,
  NodusTollensPrint,
  OnismPrint,
  SonderPrint,
  ZenosynePrint,
} from './compositions';
import type { CompositionProps } from './PrintFrame';

/** Each design's print, by composition id (typed: a missing one is a compile error). */
export const COMPOSITIONS: Record<CompositionId, ComponentType<CompositionProps>> = {
  sonder: SonderPrint,
  onism: OnismPrint,
  monachopsis: MonachopsisPrint,
  'nodus-tollens': NodusTollensPrint,
  anemoia: AnemoiaPrint,
  liberosis: LiberosisPrint,
  exulansis: ExulansisPrint,
  altschmerz: AltschmerzPrint,
  zenosyne: ZenosynePrint,
  enouement: EnouementPrint,
};
