import type { ComponentProps } from 'react';
import { Table as AntdTable } from 'antd';
import type { TableProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { VimHint } from './vim/VimHint';
import styles from './Table.module.css';

/**
 * antd's `Table` with the vim layer designed *into* its sortable column headers.
 * A sortable header is normally a plain `<th>` the layer would float an overlay
 * chip over — covering the column name. Here each sortable header instead
 * registers as a *native* hint and renders its `f` label in a reserved slot
 * inline beside the title ("Size ⭡ ab"), so the label is part of the header,
 * never an overlay on top of it. Non-sortable headers are untouched.
 *
 * A near-drop-in for antd's `Table`: swap `import { Table } from 'antd'` for
 * `from 'shared-ui'`. (Static helpers like `Table.Summary` aren't re-exposed;
 * add them here if a consumer needs them.)
 */

/** antd invokes the header-cell component with the `<th>`'s own props: a sortable
 *  header carries `ant-table-column-has-sorters` in `className` and the sort
 *  toggle in `onClick`. We register the th as a native hint (default activation
 *  clicks it → antd sorts) and render the label inline inside it. */
function SortableHeaderCell({ className, children, ...rest }: ComponentProps<'th'>) {
  const { ref, hint } = useVimHint();
  return (
    <th ref={ref} className={className} {...rest}>
      <span className={styles.header}>
        {children}
        <VimHint hint={hint} placement="slot-end" />
      </span>
    </th>
  );
}

function HeaderCell({ className, children, ...rest }: ComponentProps<'th'>) {
  const sortable =
    typeof className === 'string' && className.includes('ant-table-column-has-sorters');
  if (!sortable) {
    return (
      <th className={className} {...rest}>
        {children}
      </th>
    );
  }
  return (
    <SortableHeaderCell className={className} {...rest}>
      {children}
    </SortableHeaderCell>
  );
}

const HINTED_HEADER = { header: { cell: HeaderCell } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors antd's own TableProps default
export function Table<RecordType = any>(props: TableProps<RecordType>) {
  // Fill in only the header cell, preserving any components the caller passed.
  const components = props.components
    ? {
        ...props.components,
        header: { ...props.components.header, cell: props.components.header?.cell ?? HeaderCell },
      }
    : HINTED_HEADER;
  return <AntdTable<RecordType> {...props} components={components} />;
}

export type { TableProps };
