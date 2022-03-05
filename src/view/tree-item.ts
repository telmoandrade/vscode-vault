'use strict';

import * as vscode from 'vscode';

import * as model from '../model';

const OPTIONAL_TRAILING_SLASH = /\/?$/;
const PATH_SEPARATOR = '/';

export abstract class VaultViewTreeItem extends vscode.TreeItem {
    private _children: VaultViewTreeItem[] | undefined;
    private _name: string;
    readonly parent: VaultViewTreeItem | undefined;

    abstract refresh(returnException?: boolean): Promise<boolean>;

    constructor(label: string, parent?: VaultViewTreeItem) {
        super(label);
        this._name = label;
        this.id = ((parent?.id || PATH_SEPARATOR) + label).replace(OPTIONAL_TRAILING_SLASH, PATH_SEPARATOR);
        this.parent = parent;
    }

    get children(): VaultViewTreeItem[] | undefined {
        return this._children ? [...this._children] : undefined;
    }

    set children(value: VaultViewTreeItem[] | undefined ) {
        this._children = value ? [...value] : undefined;
    }

    get connection(): model.VaultConnection | undefined {
        return this?.parent?.connection;
    }
    get name(): string{
        return this._name;
    }
    addChild(child: VaultViewTreeItem) {
        if (this._children) {
            const names = this._children.map(m => m._name);
            const index = names.findIndex(f => f >= child._name);
            if (index === -1) {
                this._children.push(child);
            } else {
                this._children.splice(index, 0, child);
            }
        }
        else {
            this._children = [child];
        }
    }
}
