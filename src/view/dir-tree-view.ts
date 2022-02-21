import * as vscode from 'vscode';

import * as model from '../model';
import { VaultViewTreeItem } from "./tree-item";
import { VaultViewEmptyTreeItem } from './empty-tree-view';
import { VaultViewSecretTreeItem } from './secret-tree-view';
import { VaultMount } from '../model';
import { off } from 'process';
import { VaultViewMountTreeItem } from './mount-tree-view';

export class VaultViewDirTreeItem extends VaultViewTreeItem {
    constructor(private dirName: string, parent: VaultViewTreeItem) {
        super(dirName, parent);
        this.contextValue = 'dir';
        this.iconPath = new vscode.ThemeIcon('folder-opened');
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    getTotalPath(): string{
        let path=this.dirName;
        if(this.parent?.contextValue === 'dir') {
            const p = this.parent as VaultViewDirTreeItem;
            path = p.getTotalPath() +  path;
        }
        return path;

    }
    getMountPoint():VaultViewMountTreeItem {
        let node = this.parent as VaultViewTreeItem;
        while(node!== undefined) {
            if(node.contextValue==='mount') {
                return node as VaultViewMountTreeItem;
            }
            node = node.parent as VaultViewTreeItem;
        }
        throw (new Error('Should not arrive'));
    }
    recursiveAddChild(secrets : model.VaultSecret[], parent:VaultViewTreeItem):void{
        const oldSecrets = this.children;
        if (secrets.length === 0 ) {
            parent.children = [
                new VaultViewEmptyTreeItem(parent)
            ];
        } else {
            for (const secret of secrets) {
                const secretView = oldSecrets?.find(f => f.label === secret.name);
                if(secret.name.match(/\/$/)){
                    parent.addChild(secretView ||new VaultViewDirTreeItem(secret.name,parent));
                } else {
                    parent.addChild(secretView || new VaultViewSecretTreeItem(secret, parent));
                }
            }
        }

    }
    async refresh(returnException?: boolean): Promise<boolean> {

        try {
            const mountPoint= this.getMountPoint();
            const secrets = await this?.connection?.secrets(mountPoint.vaultMount ,this.getTotalPath()) || [];

            const oldSecrets = this.children;
            this.children = undefined;
            if (secrets.length === 0 ) {
                this.children = [
                    new VaultViewEmptyTreeItem(this)
                ];
            } else {
                for (const secret of secrets) {
                    const secretView = oldSecrets?.find(f => f.label === secret.name);
                    if(secret.name.match(/\/$/)){
                        this.addChild(secretView ||new VaultViewDirTreeItem(secret.name,this));
                    } else {
                        this.addChild(secretView || new VaultViewSecretTreeItem(secret, this));
                    }
                }
            }
           
        } catch (err: unknown) {
            if (returnException) {
                throw err;
            } else {
                const message = typeof err === "string" ? err :
                    err instanceof Error ? err.message : 'unknown';
                vscode.window.showErrorMessage(`Vault Error: (${message})`);

                if (!this.children) {
                    this.children = [
                        new VaultViewEmptyTreeItem(this)
                    ];
                }
            }
        }

        return true;
    }
}
