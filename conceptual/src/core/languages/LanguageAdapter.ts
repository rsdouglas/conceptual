import { SymbolInfo } from '../tsSymbols.js';

export interface LanguageAdapter {
    /**
     * File extensions this adapter supports (e.g., ['.ts', '.tsx'])
     */
    extensions: string[];

    /**
     * Extract symbols from a single file.
     */
    extractSymbols(fileContent: string, filePath: string, relativePath: string): SymbolInfo[];
}
