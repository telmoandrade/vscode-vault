'use strict';

import * as vscode from 'vscode';

import * as model from '../model';

const OPTIONAL_TRAILING_SLASH = /\/?$/;
const PATH_SEPARATOR = '/';

export abstract class VaultViewTreeItem extends vscode.TreeItem {
    private _children: VaultViewTreeItem[] | undefined;
    private _name: string;
    private _priorityOrder: number;

    abstract refresh(returnException?: boolean): Promise<boolean>;

    constructor(label: string, readonly parent?: VaultViewTreeItem, priorityOrder = 0) {
        super(label);
        this._name = label;
        this._priorityOrder = priorityOrder;
        this.id = ((parent?.id || PATH_SEPARATOR) + label).replace(OPTIONAL_TRAILING_SLASH, PATH_SEPARATOR);
    }

    get children(): VaultViewTreeItem[] | undefined {
        return this._children ? [...this._children] : undefined;
    }

    set children(value: VaultViewTreeItem[] | undefined) {
        this._children = value ? [...value] : undefined;
    }

    get connection(): model.VaultConnection | undefined {
        return this?.parent?.connection;
    }

    addChild(child: VaultViewTreeItem) {
        if (this._children) {
            const indexName = this._children.findIndex(f => f._name >= child._name && f._priorityOrder === child._priorityOrder);
            if (indexName === -1) {
                const indexPriorityOrder = this._children.findIndex(f => f._priorityOrder > child._priorityOrder);

                if (indexPriorityOrder === -1) {
                    this._children.push(child);
                } else {
                    this._children.splice(indexPriorityOrder, 0, child);
                }
            } else {
                this._children.splice(indexName, 0, child);
            }
        }
        else {
            this._children = [child];
        }
    }
}
