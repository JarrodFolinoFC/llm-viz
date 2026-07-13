import type { ReactNode } from 'react';
import { TableOutlined, AppstoreOutlined, NodeIndexOutlined, DeploymentUnitOutlined, RetweetOutlined, NumberOutlined, DotChartOutlined, BarChartOutlined, FunctionOutlined } from '@ant-design/icons';

import { BigramPage } from './pages/BigramPage';
import { TrigramScalarPage } from './pages/TrigramScalarPage';
import { LblScalarPage } from './pages/LblScalarPage';
import { VectorPage } from './pages/VectorPage';
import { MlpPage } from './pages/MlpPage';
import { MlpScalarPage } from './pages/MlpScalarPage';
import { RnnPage } from './pages/RnnPage';
import { RnnScalarPage } from './pages/RnnScalarPage';
import { BigramScalarInferencePage } from './pages/BigramScalarInferencePage';
import { VectorInferencePage } from './pages/VectorInferencePage';
import { MlpInferencePage } from './pages/MlpInferencePage';
import { MlpScalarInferencePage } from './pages/MlpScalarInferencePage';
import { RnnInferencePage } from './pages/RnnInferencePage';
import { RnnScalarInferencePage } from './pages/RnnScalarInferencePage';
import { ComparePage } from './pages/ComparePage';
import { WhyTwoWeightsPage } from './pages/WhyTwoWeightsPage';

export type ModelKind = 'bigram' | 'trigram' | 'lbl' | 'mlp' | 'rnn';
export type ReprKind = 'scalar' | 'vector';

export interface NavItem {
  path: string;
  label: string;
  /** Model family / representation icons; utility pages (e.g. Compare) have neither. */
  model?: ModelKind;
  repr?: ReprKind;
  /** Standalone icon for items without a model/repr pair. */
  icon?: ReactNode;
  /** The page rendered at `path` — so the menu and the routes share one list. */
  element: ReactNode;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/**
 * Single source of truth for the app's pages: this drives both the sidebar menu
 * and the router. Add a page here once and it appears in both — no separate
 * `<Routes>` list to keep in sync (see {@link REDIRECTS} for bare-path aliases;
 * the roadmap landing page at `/` is registered directly in App).
 */
export const NAV: NavGroup[] = [
  {
    heading: 'Training',
    items: [
      { path: '/bigram/training/scalar', label: 'Bigram (s)', model: 'bigram', repr: 'scalar', element: <BigramPage /> },
      { path: '/bigram/training/vector/2d', label: 'Bigram (v)', model: 'bigram', repr: 'vector', element: <VectorPage dim={2} /> },
      { path: '/trigram/training/scalar', label: 'Trigram (s)', model: 'trigram', repr: 'scalar', element: <TrigramScalarPage /> },
      { path: '/lbl/training/scalar', label: 'Log-bilinear (s)', model: 'lbl', repr: 'scalar', element: <LblScalarPage /> },
      { path: '/mlp/training/scalar', label: 'MLP (s)', model: 'mlp', repr: 'scalar', element: <MlpScalarPage /> },
      { path: '/mlp/training', label: 'MLP for NLP', model: 'mlp', repr: 'vector', element: <MlpPage /> },
      { path: '/rnn/training/scalar', label: 'RNN (s)', model: 'rnn', repr: 'scalar', element: <RnnScalarPage /> },
      { path: '/rnn/training/vector', label: 'RNN (v)', model: 'rnn', repr: 'vector', element: <RnnPage /> },
    ],
  },
  {
    heading: 'Inference',
    items: [
      { path: '/bigram/inference/scalar', label: 'Bigram (s)', model: 'bigram', repr: 'scalar', element: <BigramScalarInferencePage /> },
      { path: '/bigram/inference/vector/2d', label: 'Bigram (v)', model: 'bigram', repr: 'vector', element: <VectorInferencePage dim={2} /> },
      { path: '/mlp/inference', label: 'MLP for NLP', model: 'mlp', repr: 'vector', element: <MlpInferencePage /> },
      { path: '/mlp/inference/scalar', label: 'MLP (s)', model: 'mlp', repr: 'scalar', element: <MlpScalarInferencePage /> },
      { path: '/rnn/inference', label: 'RNN (v)', model: 'rnn', repr: 'vector', element: <RnnInferencePage /> },
      { path: '/rnn/inference/scalar', label: 'RNN (s)', model: 'rnn', repr: 'scalar', element: <RnnScalarInferencePage /> },
    ],
  },
  {
    heading: 'Analysis',
    items: [
      { path: '/compare', label: 'Model comparison', icon: <BarChartOutlined />, element: <ComparePage /> },
      { path: '/why-two-weights', label: 'Why two weights?', icon: <FunctionOutlined />, element: <WhyTwoWeightsPage /> },
    ],
  },
];

/** Bare parent paths that redirect to their default child (not shown in the nav). */
export const REDIRECTS: { from: string; to: string }[] = [
  { from: '/bigram/training', to: '/bigram/training/scalar' },
  { from: '/bigram/training/vector', to: '/bigram/training/vector/2d' },
  { from: '/bigram/inference', to: '/bigram/inference/scalar' },
  { from: '/bigram/inference/vector', to: '/bigram/inference/vector/2d' },
  { from: '/rnn/training', to: '/rnn/training/scalar' },
];

/** Every navigable item, flattened across groups (for building the routes). */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

/** One icon for the model family, one for its token representation. */
export const MODEL_ICON: Record<ModelKind, ReactNode> = {
  bigram: <TableOutlined />,
  trigram: <AppstoreOutlined />,
  lbl: <NodeIndexOutlined />,
  mlp: <DeploymentUnitOutlined />,
  rnn: <RetweetOutlined />,
};
export const REPR_ICON: Record<ReprKind, ReactNode> = {
  scalar: <NumberOutlined />,
  vector: <DotChartOutlined />,
};
