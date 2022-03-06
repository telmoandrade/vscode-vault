'use strict';

import * as vscode from 'vscode';
import validator from 'validator';

import * as model from '../model';
import { VaultViewTreeItem } from './tree-item';
import { VaultViewServerTreeItem } from './server-tree-view';

export class VaultViewTreeDataProvider implements vscode.TreeDataProvider<VaultViewTreeItem> {
    private _vaultViewServerTreeItens: VaultViewServerTreeItem[] = [];
    private _onDidChangeTreeData = new vscode.EventEmitter<VaultViewTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    /* eslint-disable @typescript-eslint/naming-convention */
    private _validateIsEmptyOptions = { ignore_whitespace: true };
    private _validadeIsURLOptions = {
        require_protocol: true,
        disallow_auth: true,
        protocols: ['http', 'https'],
        require_tld: false
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    set setVaultConfigurations(vaultConfigurations: model.VaultConfiguration[] | undefined) {
        if (!Array.isArray(vaultConfigurations)) {
            this._vaultViewServerTreeItens = [];
            this._onDidChangeTreeData.fire();
            return;
        }

        const validVaultConfigurations = vaultConfigurations
            .filter(f => {
                try {
                    if (validator.isEmpty(f.name, this._validateIsEmptyOptions)) {
                        return false;
                    }

                    if (!validator.isURL(f.endpoint, this._validadeIsURLOptions)) {
                        return false;
                    }

                    if (!validator.isIn(f.auth.method, ['token', 'username'])) {
                        return false;
                    }

                    if (f.auth.method === 'token') {
                        if (validator.isEmpty(f.auth.token, this._validateIsEmptyOptions)) {
                            return false;
                        }
                    } else if (f.auth.method === 'username') {
                        if (validator.isEmpty(f.auth.mountPoint, this._validateIsEmptyOptions)) {
                            return false;
                        }
                        if (validator.isEmpty(f.auth.username, this._validateIsEmptyOptions)) {
                            return false;
                        }
                        if (validator.isEmpty(f.auth.password, this._validateIsEmptyOptions)) {
                            return false;
                        }
                    }

                    return true;
                } catch (e) {
                    return false;
                }
            });

        const oldVaultViewServerTreeItens = this._vaultViewServerTreeItens;
        this._vaultViewServerTreeItens = validVaultConfigurations
            .reverse()
            .reduce((acc: model.VaultConfiguration[], r) => {
                if (acc.some(s => s.name === r.name)) {
                    return acc;
                }
                return [...acc, r];
            }, [])
            .reverse()
            .map(m => {
                const vaultViewServerTreeItem = this._vaultViewServerTreeItens.find(f => f.isVaultConfiguration(m));
                return vaultViewServerTreeItem || new VaultViewServerTreeItem(new model.VaultConnection(m));
            });

        for (const oldVaultViewServerTreeItem of oldVaultViewServerTreeItens) {
            if (!this._vaultViewServerTreeItens.some(s => s === oldVaultViewServerTreeItem)) {
                oldVaultViewServerTreeItem.disconnect();
            }
        }

        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: VaultViewTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: VaultViewTreeItem): vscode.ProviderResult<VaultViewTreeItem[]> {
        let providerResult: vscode.ProviderResult<VaultViewTreeItem[]>;
        if (element === undefined) {
            providerResult = this._vaultViewServerTreeItens;
        } else if (element.children === undefined) {
            if (element.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
                this.refresh(element);
            }
        } else {
            providerResult = element.children;
        }
        return providerResult;
    }

    getParent(element: VaultViewTreeItem): vscode.ProviderResult<VaultViewTreeItem> {
        return element.parent;
    }

    async refresh(element?: VaultViewTreeItem) {
        if (!element || await element.refresh()) {
            this._onDidChangeTreeData.fire();
        }
    }
}
