import path from 'node:path';
import ts from 'typescript';
import { SymbolInfo, SymbolKind } from '../../tsSymbols.js';
import { LanguageAdapter } from '../LanguageAdapter.js';

function getLineAndColumn(sourceFile: ts.SourceFile, pos: number) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
    return { line: line + 1, column: character + 1 }; // 1-based
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    return !!ts.canHaveModifiers(node) && !!node.modifiers?.some(m => m.kind === kind);
}

function isExported(node: ts.Node): { isExported: boolean; isDefaultExport: boolean } {
    const isExport = hasModifier(node, ts.SyntaxKind.ExportKeyword);
    const isDefault = hasModifier(node, ts.SyntaxKind.DefaultKeyword);
    return { isExported: isExport || isDefault, isDefaultExport: isDefault };
}

export class TypeScriptAdapter implements LanguageAdapter {
    extensions = ['.ts', '.tsx', '.js', '.jsx'];

    extractSymbols(sourceText: string, filePath: string, relativePath: string): SymbolInfo[] {
        // Pick script kind based on extension
        const ext = path.extname(filePath);
        const scriptKind =
            ext === '.tsx' ? ts.ScriptKind.TSX :
                ext === '.jsx' ? ts.ScriptKind.JSX :
                    ext === '.js' ? ts.ScriptKind.JS :
                        ts.ScriptKind.TS;

        const sourceFile = ts.createSourceFile(
            filePath,
            sourceText,
            ts.ScriptTarget.Latest,
            true,
            scriptKind,
        );

        const symbols: SymbolInfo[] = [];

        function addSymbol(
            name: string | undefined,
            kind: SymbolKind,
            node: ts.Node,
            exportInfo: { isExported: boolean; isDefaultExport: boolean },
        ) {
            if (!name) return;
            const { line, column } = getLineAndColumn(sourceFile, node.getStart(sourceFile));
            symbols.push({
                name,
                kind,
                filePath,
                relativePath,
                isExported: exportInfo.isExported,
                isDefaultExport: exportInfo.isDefaultExport,
                line,
                column,
            });
        }

        function visit(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration: {
                    const cls = node as ts.ClassDeclaration;
                    const exportInfo = isExported(cls);
                    addSymbol(cls.name?.text, 'class', cls, exportInfo);
                    break;
                }
                case ts.SyntaxKind.InterfaceDeclaration: {
                    const iface = node as ts.InterfaceDeclaration;
                    const exportInfo = isExported(iface);
                    addSymbol(iface.name.text, 'interface', iface, exportInfo);
                    break;
                }
                case ts.SyntaxKind.TypeAliasDeclaration: {
                    const typeAlias = node as ts.TypeAliasDeclaration;
                    const exportInfo = isExported(typeAlias);
                    addSymbol(typeAlias.name.text, 'typeAlias', typeAlias, exportInfo);
                    break;
                }
                case ts.SyntaxKind.EnumDeclaration: {
                    const en = node as ts.EnumDeclaration;
                    const exportInfo = isExported(en);
                    addSymbol(en.name.text, 'enum', en, exportInfo);
                    break;
                }
                case ts.SyntaxKind.FunctionDeclaration: {
                    const fn = node as ts.FunctionDeclaration;
                    const exportInfo = isExported(fn);
                    // Only care about named functions
                    addSymbol(fn.name?.text, 'function', fn, exportInfo);
                    break;
                }
                case ts.SyntaxKind.VariableStatement: {
                    const v = node as ts.VariableStatement;
                    const exportInfo = isExported(v);
                    if (!exportInfo.isExported) break; // for now: only exported variables
                    // Could be multiple declarations: export const A = ..., B = ...
                    for (const decl of v.declarationList.declarations) {
                        const name = decl.name;
                        if (ts.isIdentifier(name)) {
                            addSymbol(name.text, 'variable', v, exportInfo);
                        }
                    }
                    break;
                }
                default:
                    break;
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        return symbols;
    }
}
