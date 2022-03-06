import * as vscode from 'vscode';

import * as model from '../model';
import { VaultViewTreeItem } from "./tree-item";

export class VaultViewSecretTreeItem extends VaultViewTreeItem {
    constructor(private _vaultSecret: model.VaultSecret, parent: VaultViewTreeItem, priorityOrder: number) {
        super(_vaultSecret.name, parent, priorityOrder);
        this.contextValue = 'secret';
        this.iconPath = new vscode.ThemeIcon('symbol-object');
        this.children = [];
    }

    async refresh(): Promise<boolean> {
        return true;
    }

    async read(): Promise<model.VaultData[]> {
        return await this?.connection?.data(this._vaultSecret) || [];
    }
}