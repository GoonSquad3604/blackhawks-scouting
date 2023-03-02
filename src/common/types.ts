// INTERFACES IN THIS FILE WILL BE REPLACED ONCE JSON SCHEMA VALIDATION IS IMPLEMENTED

export interface ConfigData {
  heading?: string;
  logo?: string;
  skipTeamSelection?: boolean;
  forceQualifiers?: boolean;
  pages: PageData[];
  showInAnalysis: boolean;
  showInTeamOverview: boolean;
}

export interface PageData {
  name: string;
  widgets: WidgetData[];
}

export interface WidgetData {
  // Required field
  type: string;

  // Global optional fields
  prefix?: string;
  align?: string;
  noLabel?: boolean;
  row?: number;
  col?: number;
  rowspan?: number;
  colspan?: number;
  labelColspan?: number;
  //sortable?: boolean;

  // Type-specific required fields
  name?: string;
  file?: string;
  options?: string[];

  // Type-specific optional fields
  defaultOption?: boolean;
  width?: number;
  height?: number;
  allowMultiple?: boolean;
  selectRadius?: number;
  selectColor?: string;
  default?: number;
  min?: number;
  max?: number;
  allowKeyboardInput?: boolean;
  startLabel?: string;
  lapLabel?: string;
  stopLabel?: string;
  maxLaps?: number;
  points?: number; //pts associated with widget. Used for aggregate score. applical to checkmarks and numbers/spinboxes
  pointsForOptions?: number[]; // pts for each option. Array must match up with options array for dropdowns, multicheckboxes and radio btns

  //Type-specific logic fields
  validation?: ValidationData;
  aggregates?: AggregateData[];
  filter?: FilterSetup; // filter on analysis screen
}

export interface ValidationData {
  comparison: string;
  value: number | number[];
}

export interface AggregateData {
  aggregate: string; //Average, AverageIfOverZero, Min, Max and Sum are supported. AverageIfOverZero only uses greater than zero values to calc average
  sortable: boolean;
}

export interface FilterSetup {
  type?: string; //if undefined it defaults to the type for the widget. Works for dropdown, checkbox, numbers and radio
  enabled: boolean;
  label: string;
  comparisonEnabled: boolean;
}

export enum LabelType {
  None,
  LabelTag,
  PlainText
}
