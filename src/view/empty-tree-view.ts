import * as vscode from 'vscode';

import { VaultViewTreeItem } from "./tree-item";

export class VaultViewEmptyTreeItem extends VaultViewTreeItem {
    constructor(parent: VaultViewTreeItem) {
        super('Empty', parent);
        this.contextValue = 'empty';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.children = [];
    }

    async refresh(): Promise<boolean> {
        return true;
    }
}