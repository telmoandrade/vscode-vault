import * as vscode from 'vscode';

import * as model from '../model';
import { VaultViewTreeItem } from "./tree-item";

export class VaultViewSecretTreeItem extends VaultViewTreeItem {
    constructor(private vaultSecret: model.VaultSecret, parent: VaultViewTreeItem) {
        super(vaultSecret.name, parent);
        this.contextValue = 'secret';
        this.iconPath = new vscode.ThemeIcon('symbol-object');
        this.children = [];
    }

    async refresh(): Promise<boolean> {
        return true;
    }

    async read(): Promise<model.VaultData[]> {
        return await this?.connection?.data(this.vaultSecret)  || [];
    }
}