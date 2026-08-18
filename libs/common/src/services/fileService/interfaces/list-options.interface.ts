export interface ListOptions {
  path: string;

  recursive?: boolean;

  filesOnly?: boolean;

  directoriesOnly?: boolean;

  includeHidden?: boolean;

  extensions?: string[];
}