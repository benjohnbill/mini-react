export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };
