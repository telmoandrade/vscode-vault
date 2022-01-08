'use strict';

import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';

import * as model from './model';
import * as view from './view';

const VAULT_ENV_CONFIGURATIONS_CONNECTIONS = 'vault.env.connections';

export function activate(context: vscode.ExtensionContext) {
	const vaultViewTreeDataProvider = new view.VaultViewTreeDataProvider();
	const treeView = vscode.window.createTreeView('vault.env.views.vaultView', { treeDataProvider: vaultViewTreeDataProvider });

	const loadConfiguration = async () => {
		const vaultConfigurations = await vscode.workspace.getConfiguration().get<model.VaultConfiguration[]>(VAULT_ENV_CONFIGURATIONS_CONNECTIONS);
		if (!vaultConfigurations || vaultConfigurations.length === 0) {
			vscode.window.showInformationMessage('No vault server configured');
		}
		vaultViewTreeDataProvider.setVaultConfigurations = vaultConfigurations;
	};

	const eventListener = vscode.workspace.onDidChangeConfiguration(async e => {
		if (e.affectsConfiguration(VAULT_ENV_CONFIGURATIONS_CONNECTIONS)) {
			await loadConfiguration();
		}
	});

	loadConfiguration();

	const configureFn = () => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:telmoandrade.vault-to-env');

	const connectFn = (treeItem: view.VaultViewServerTreeItem) =>
		treeItem.connect()
			.then(() => vaultViewTreeDataProvider.refresh())
			.catch((err: Error) => vscode.window.showErrorMessage(`Unable to connect to Vault (${err.message})`));

	const refreshFn = (treeItem: view.VaultViewTreeItem) =>
		treeItem.refresh(true)
			.then(() => vaultViewTreeDataProvider.refresh())
			.catch((err: Error) => vscode.window.showErrorMessage(`Unable to refresh Vault data (${err.message})`));

	const disconnectFn = (treeItem: view.VaultViewServerTreeItem) =>
		treeItem.disconnect()
			.then(() => vaultViewTreeDataProvider.refresh())
			.catch((err: Error) => vscode.window.showErrorMessage(`Unable to disconnect from Vault (${err.message})`));

	const writeFn = (treeItem: view.VaultViewSecretTreeItem) =>
		treeItem.read()
			.then(async (data) => {
				const addContent = async (textEditor?: vscode.TextEditor) => {
					await textEditor?.edit(editBuilder => {
						const length = textEditor.document.getText().length;
						const positionAt = textEditor.document.positionAt(length);

						const eol = textEditor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';

						let value = length > 0 ? eol + eol : "";
						value += `#VaultEnv ==> ${treeItem.parent?.parent?.label} -> ${treeItem.parent?.label} -> ${treeItem.label} -> ${new Date().toISOString()}`;
						value += eol + eol;
						value += `${data.map(m => `${m.key}=${m.value}`).join(eol)}${eol}`;

						editBuilder.insert(positionAt, value);

						const range = new vscode.Range(positionAt, positionAt);
						textEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
					});
				};

				if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
					const openTextDocument = await vscode.workspace.openTextDocument({ content: '', language: 'dotenv' });
					const textEditor = await vscode.window.showTextDocument(openTextDocument);
					await addContent(textEditor);
					return;
				}

				let workspaceFoldersUri: vscode.Uri | undefined = undefined;
				if (vscode.workspace.workspaceFolders.length === 1) {
					workspaceFoldersUri = vscode.workspace.workspaceFolders[0].uri;
				} else {
					const activeTextEditor = vscode.window.activeTextEditor;
					if (activeTextEditor) {
						workspaceFoldersUri = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri)?.uri;
					}

					if (!workspaceFoldersUri) {
						const quickPick = await vscode.window.showQuickPick(
							vscode.workspace.workspaceFolders.map(m => ({
								label: m.name,
								target: m.uri,
							})),
							{ placeHolder: 'Select workspace.' });

						if (!quickPick) {
							return;
						}
						workspaceFoldersUri = quickPick.target;
					}
				}

				if (workspaceFoldersUri) {
					const envUri = vscode.Uri.joinPath(workspaceFoldersUri, '.env');
					try {
						await vscode.workspace.fs.stat(envUri);
					} catch {
						await vscode.workspace.fs.writeFile(envUri, Buffer.from('', 'utf8'));
					}

					const textEditor = await vscode.window.showTextDocument(envUri);
					await addContent(textEditor);
				}
			})
			.catch((err: Error) => vscode.window.showErrorMessage(`Unable to write .env from Vault (${err.message})`));

	context.subscriptions.push(
		eventListener,
		treeView,
		vscode.commands.registerCommand('vault.env.commands.configure', configureFn),
		vscode.commands.registerCommand('vault.env.commands.connect', connectFn),
		vscode.commands.registerCommand('vault.env.commands.disconnect', disconnectFn),
		vscode.commands.registerCommand('vault.env.commands.refresh', refreshFn),
		vscode.commands.registerCommand('vault.env.commands.write', writeFn),
	);
}

export function deactivate() { }
