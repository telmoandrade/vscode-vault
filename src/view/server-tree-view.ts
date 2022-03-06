'use strict';

import * as vscode from 'vscode';

import * as model from '../model';
import { VaultViewTreeItem } from './tree-item';
import { VaultViewMountTreeItem } from './mount-tree-view';
import { VaultViewEmptyTreeItem } from './empty-tree-view';

export class VaultViewServerTreeItem extends VaultViewTreeItem {
    /* eslint-disable @typescript-eslint/naming-convention */
    private static readonly WARNING_ICON = new vscode.ThemeIcon('warning');
    private static readonly SERVER_ICON = new vscode.ThemeIcon('server-environment');
    /* eslint-enable @typescript-eslint/naming-convention */

    constructor(private readonly _vaultConnection: model.VaultConnection) {
        super(_vaultConnection.name);
        this.contextValue = 'server-disconnected';
        this.iconPath = VaultViewServerTreeItem.SERVER_ICON;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this._vaultConnection = _vaultConnection;
    }

    isVaultConfiguration(vaultConfiguration: model.VaultConfiguration): boolean {
        return this._vaultConnection.isVaultConfiguration(vaultConfiguration);
    }

    async connect(): Promise<void> {
        await this._vaultConnection.login();
        this.contextValue = 'server-connected';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    get connection(): model.VaultConnection | undefined {
        return this._vaultConnection;
    }

    async disconnect(): Promise<void> {
        this._vaultConnection.dispose();
        this.iconPath = VaultViewServerTreeItem.SERVER_ICON;
        this.contextValue = 'server-disconnected';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.children = undefined;
    }

    async refresh(): Promise<boolean> {
        try {
            const mounts = await this._vaultConnection.mounts();

            const oldMounts = this.children;
            this.children = undefined;
            for (const mount of mounts) {
                const secretView = oldMounts?.find(f => f.label === mount.name);
                this.addChild(secretView || new VaultViewMountTreeItem(mount, this));
            }
        } catch (err: unknown) {
            this.iconPath = VaultViewServerTreeItem.WARNING_ICON;

            const message = typeof err === "string" ? err :
                err instanceof Error ? err.message : 'unknown';
            vscode.window.showErrorMessage(`Vault Error: (${message})`);

            if (!this.children) {
                this.children = [
                    new VaultViewEmptyTreeItem(this)
                ];
            }
        }
        return true;
    }
}