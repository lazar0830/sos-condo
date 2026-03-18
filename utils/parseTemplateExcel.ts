import * as XLSX from 'xlsx';
import { ComponentType } from '../types';
import type { ComponentCategoriesData } from '../services/firestoreService';

export type ParsedTemplateRow = {
  data: Omit<import('../types').ComponentTemplate, 'id' | 'createdBy'> | null;
  error?: string;
  rowIndex: number;
  raw: Record<string, unknown>;
};

export type ParseResult = {
  format: 'full' | 'minimal';
  rows: ParsedTemplateRow[];
};

const TYPE_ALIASES: Record<string, ComponentType> = {
  building: ComponentType.Building,
  immeuble: ComponentType.Building,
  site: ComponentType.Site,
  unit: ComponentType.Unit,
  unité: ComponentType.Unit,
  unite: ComponentType.Unit,
};

function normalizeHeader(h: string): string {
  return String(h ?? '')
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')
    .trim();
}

function normalizeType(value: string): ComponentType | null {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  return TYPE_ALIASES[v] ?? (v === 'building' || v === 'site' || v === 'unit' ? (v as ComponentType) : null) ?? null;
}

function looksLikeHeaderRow(normHeaders: string[]): boolean {
  // If the first row contains expected header tokens, treat it as header.
  const tokens = ['type', 'category', 'subcategory', 'componentname', 'template'];
  return normHeaders.some((h) => tokens.some((t) => h === t || h.includes(t)));
}

function findComponentNameInCategories(
  componentName: string,
  categories: ComponentCategoriesData
): { type: ComponentType; parentCategory: string; subCategory: string } | null {
  const name = String(componentName ?? '').trim();
  if (!name) return null;
  const found: { type: ComponentType; parentCategory: string; subCategory: string }[] = [];
  for (const type of [ComponentType.Building, ComponentType.Site, ComponentType.Unit]) {
    const typeData = categories[type];
    if (!typeData) continue;
    for (const [parentCategory, subMap] of Object.entries(typeData)) {
      for (const [subCategory, names] of Object.entries(subMap)) {
        if (names && names.includes(name)) {
          found.push({ type, parentCategory, subCategory });
        }
      }
    }
  }
  return found.length === 1 ? found[0]! : found.length > 1 ? found[0]! : null;
}

export function parseTemplateExcel(
  file: File,
  componentCategories: ComponentCategoriesData
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result;
        if (!ab || !(ab instanceof ArrayBuffer)) {
          resolve({ format: 'full', rows: [{ data: null, error: 'Could not read file', rowIndex: 0, raw: {} }] });
          return;
        }
        const wb = XLSX.read(ab, { type: 'array', cellText: false, cellDates: false });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) {
          resolve({ format: 'full', rows: [{ data: null, error: 'No sheet found', rowIndex: 0, raw: {} }] });
          return;
        }
        const sheet = wb.Sheets[firstSheet];
        const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
        if (!json.length) {
          resolve({ format: 'full', rows: [] });
          return;
        }
        const firstRow = (json[0] as unknown[]).map((c) => String(c ?? ''));
        const firstRowNorm = firstRow.map(normalizeHeader);
        const hasHeader = looksLikeHeaderRow(firstRowNorm);
        const headerRow = hasHeader ? firstRow : [];
        const headerNorm = hasHeader ? firstRowNorm : [];
        const findCol = (candidates: string[]): number => {
          const n = candidates.map((c) => c.toLowerCase().replace(/[\s\-_]+/g, ''));
          for (let i = 0; i < headerNorm.length; i++) {
            if (n.some((c) => headerNorm[i] === c || headerNorm[i].includes(c))) return i;
          }
          return -1;
        };
        let colType = findCol(['type']);
        let colCategory = findCol(['category']);
        let colSubCategory = findCol(['subcategory', 'sub category', 'sub_category']);
        let colComponentName = findCol(['componentname', 'component name']);
        let colTemplate = findCol(['template']);

        const hasFull = hasHeader && [colType, colCategory, colSubCategory, colComponentName, colTemplate].every((c) => c >= 0);
        const hasMinimal = hasHeader && colComponentName >= 0 && colTemplate >= 0;

        // If there is no header row, support the minimal 2-column format by position:
        // Column A = Component Name, Column B = Template, starting from first row as data.
        if (!hasHeader) {
          colComponentName = 0;
          colTemplate = 1;
        }

        const format: 'full' | 'minimal' = hasFull ? 'full' : 'minimal';
        const rows: ParsedTemplateRow[] = [];

        const startRowIndex = hasHeader ? 1 : 0;
        for (let i = startRowIndex; i < json.length; i++) {
          const rowArr = json[i] as unknown[];
          const raw: Record<string, string> = {};
          if (hasHeader) {
            headerRow.forEach((h, j) => {
              raw[h] = rowArr[j] !== undefined && rowArr[j] !== null ? String(rowArr[j]) : '';
            });
          } else {
            raw['Component Name'] = rowArr[0] !== undefined && rowArr[0] !== null ? String(rowArr[0]) : '';
            raw['Template'] = rowArr[1] !== undefined && rowArr[1] !== null ? String(rowArr[1]) : '';
          }
          const get = (col: number) => (col >= 0 && col < rowArr.length ? String(rowArr[col] ?? '').trim() : '');
          const componentName = get(colComponentName);
          const templateText = get(colTemplate);

          if (!componentName && !templateText) {
            rows.push({ data: null, rowIndex: i + 1, raw: raw as Record<string, unknown> });
            continue;
          }
          if (!componentName) {
            rows.push({
              data: null,
              error: 'Component Name is required',
              rowIndex: i + 1,
              raw: raw as Record<string, unknown>,
            });
            continue;
          }
          if (!templateText) {
            rows.push({
              data: null,
              error: 'Template is required',
              rowIndex: i + 1,
              raw: raw as Record<string, unknown>,
            });
            continue;
          }

          if (format === 'minimal') {
            const resolved = findComponentNameInCategories(componentName, componentCategories);
            if (!resolved) {
              rows.push({
                data: null,
                error: 'Component name not found in categories',
                rowIndex: i + 1,
                raw: raw as Record<string, unknown>,
              });
              continue;
            }
            rows.push({
              data: {
                type: resolved.type,
                parentCategory: resolved.parentCategory,
                subCategory: resolved.subCategory,
                componentName,
                description: templateText,
              },
              rowIndex: i + 1,
              raw: raw as Record<string, unknown>,
            });
            continue;
          }

          const typeStr = get(colType);
          const type = normalizeType(typeStr);
          const parentCategory = get(colCategory);
          const subCategory = get(colSubCategory);

          // Prefer explicit Type/Category/Sub-Category when valid, but if they
          // don't match our configured categories, fall back to resolving by
          // Component Name only (so 5-column files with outdated categories
          // still work like the 2-column minimal format).
          let resolved =
            type && componentCategories[type] &&
            componentCategories[type]![parentCategory] &&
            componentCategories[type]![parentCategory]![subCategory] &&
            componentCategories[type]![parentCategory]![subCategory]!.includes(componentName)
              ? {
                  type,
                  parentCategory,
                  subCategory,
                }
              : findComponentNameInCategories(componentName, componentCategories);

          if (!resolved) {
            rows.push({
              data: null,
              error: 'Component name not found in categories',
              rowIndex: i + 1,
              raw: raw as Record<string, unknown>,
            });
            continue;
          }

          rows.push({
            data: {
              type: resolved.type,
              parentCategory: resolved.parentCategory,
              subCategory: resolved.subCategory,
              componentName,
              description: templateText,
            },
            rowIndex: i + 1,
            raw: raw as Record<string, unknown>,
          });
        }
        resolve({ format, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
