import * as vscode from 'vscode';

const FIND_FILE_PATTERN = '**/.gitignore';
const FILE_WATCHER_PATTERN = '**/.gitignore';
const SHOW_HIDE_COMMAND = 'hide-git-ignored.toggle';
const EXCLUDE_GIT_IGNORE = 'explorer.excludeGitIgnore';
const fileWatcher = vscode.workspace.createFileSystemWatcher(FILE_WATCHER_PATTERN, false, true, false);

let statusBarItem: vscode.StatusBarItem;

async function hasGitIgnoreFile(): Promise<boolean> {
	return (await vscode.workspace.findFiles(FIND_FILE_PATTERN)).length > 0;
}

async function hideGitIgnored() {
	const target = vscode.ConfigurationTarget.Workspace;
	const configuration = vscode.workspace.getConfiguration();
	const currentSettings = configuration.get(EXCLUDE_GIT_IGNORE);
	configuration.update(EXCLUDE_GIT_IGNORE, !currentSettings, target);

	await hasGitIgnoreFile() ? updateStatusBar(!currentSettings) : false;
}

function updateStatusBar(excluded: boolean | undefined): void {
	if (!excluded || undefined) {
		statusBarItem.text = '$(eye) .gitIgnore';
		statusBarItem.tooltip = '.gitIgnored files are visible';
	} else {
		statusBarItem.text = '$(eye-closed) .gitIgnore';
		statusBarItem.tooltip = '.gitIgnored files are hidden';
	}
}

const enableCommand = async () => {
	await hasGitIgnoreFile() ? statusBarItem.show() : statusBarItem.hide();
};

function isGitIgnoredExcluded(): boolean | undefined {
	return vscode.workspace.getConfiguration().get(EXCLUDE_GIT_IGNORE);
}

const disposable = vscode.commands.registerCommand(SHOW_HIDE_COMMAND, async () => {
	await hideGitIgnored();
});

export async function activate(context: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);

	fileWatcher.onDidCreate(async () => enableCommand());
	fileWatcher.onDidDelete(async () => enableCommand());

	(statusBarItem.command = SHOW_HIDE_COMMAND),
		async () => {
			hideGitIgnored();
		};

	updateStatusBar(isGitIgnoredExcluded());
	enableCommand();

	context.subscriptions.push(statusBarItem);
	context.subscriptions.push(disposable);
}

export function deactivate() {
	// No-op.
}
