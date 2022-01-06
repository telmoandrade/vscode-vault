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
				const envUri = vscode.Uri.file(context.asAbsolutePath('.env'));
				let content = '';
				try {
					const contentEncoded = await vscode.workspace.fs.readFile(envUri);
					content = new TextDecoder('utf-8').decode(contentEncoded);

				} catch (error) { }

				content = content +
					`\n\n#VaultEnv ==> ${treeItem.parent?.parent?.label} -> ${treeItem.parent?.label} -> ${treeItem.label} -> ${new Date().toISOString()}\n\n`+
					data.map(m => `${m.key}=${m.value}`).join('\n');

				await vscode.workspace.fs.writeFile(envUri, new TextEncoder().encode(content.trim() + '\n'));
				vscode.window.showTextDocument(envUri);
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
