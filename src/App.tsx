import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Layout, Menu } from 'antd';
import { GithubOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { NAV, NAV_ITEMS, REDIRECTS, MODEL_ICON, REPR_ICON, type NavItem } from './navigation';
import styles from './App.module.css';

const GITHUB_URL = 'https://github.com/JarrodFolinoFC/llm-viz';

/** Composed "model + representation" glyph (or the item's own icon) beside the label. */
function navIcon(item: NavItem): ReactNode {
  if (!item.model || !item.repr) return item.icon ?? null;
  return (
    <span className={styles.navIcons}>
      {MODEL_ICON[item.model]}
      {REPR_ICON[item.repr]}
    </span>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(true);

  // Ctrl+H toggles the sidebar. Ignored while typing in a field, where Ctrl+H
  // means delete-backward on macOS.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'h') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      e.preventDefault();
      setNavOpen((open) => !open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const menuItems = NAV.map((group) => ({
    key: group.heading,
    label: group.heading,
    type: 'group' as const,
    children: group.items.map((n) => ({
      key: n.path,
      label: n.label,
      icon: navIcon(n),
    })),
  }));

  const navColumn = (
    <div className={styles.navColumn}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
        className={styles.menu}
      />
    </div>
  );

  // Routes are derived from the single NAV list (plus the bare-path redirects
  // and the roadmap landing page at /), so adding a page means editing
  // navigation.tsx only.
  const routes = (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {REDIRECTS.map((r) => (
          <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />
        ))}
        {NAV_ITEMS.map((n) => (
          <Route key={n.path} path={n.path} element={n.element} />
        ))}
      </Routes>
    </ErrorBoundary>
  );

  return (
    <Layout className={styles.layout}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setNavOpen((open) => !open)}
          aria-label={navOpen ? 'Hide navigation' : 'Show navigation'}
          title="Toggle navigation (Ctrl+H)"
        >
          {navOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </button>
        <Link to="/" className={styles.titleLink}>
          <h1 className={styles.appTitle}>LLM Viz</h1>
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.githubLink}
          aria-label="View source on GitHub"
        >
          <GithubOutlined />
        </a>
      </header>
      <Layout>
        <Layout.Sider
          width={240}
          collapsed={!navOpen}
          collapsedWidth={0}
          trigger={null}
          theme="light"
          className={styles.sider}
        >
          {navColumn}
        </Layout.Sider>
        <Layout.Content className={styles.content}>{routes}</Layout.Content>
      </Layout>
    </Layout>
  );
}
