import * as vscode from 'vscode';

const FIND_FILE_PATTERN = '**/.gitignore';
const FILE_WATCHER_PATTERN = '**/.gitignore';
const HIDE_COMMAND = 'hide-git-ignored.hide';
const SHOW_COMMAND = 'hide-git-ignored.show';
const EXCLUDE_GIT_IGNORE = 'explorer.excludeGitIgnore';
const fileWatcher = vscode.workspace.createFileSystemWatcher(FILE_WATCHER_PATTERN, false, true, false);

let statusBarItem: vscode.StatusBarItem;

async function hasGitIgnoreFile(): Promise<boolean> {
	const gitIgnoreFound = (await vscode.workspace.findFiles(FIND_FILE_PATTERN)).length > 0;
	return gitIgnoreFound;
}

async function hideGitIgnored() {
	const target = vscode.ConfigurationTarget.Workspace;
	const configuration = vscode.workspace.getConfiguration();
	const currentSettings = configuration.get(EXCLUDE_GIT_IGNORE);
	configuration.update(EXCLUDE_GIT_IGNORE, !currentSettings, target);
	vscode.commands.executeCommand('setContext', 'hide-git-ignored:isGitIgnoredExcluded', !currentSettings);


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
	vscode.commands.executeCommand('setContext', 'hide-git-ignored:isGitIgnoredFound', await hasGitIgnoreFile());
};

function isGitIgnoredExcluded(): boolean | undefined {
	return vscode.workspace.getConfiguration().get(EXCLUDE_GIT_IGNORE);
}

const hideCommand = vscode.commands.registerCommand(HIDE_COMMAND, async () => {
	await hideGitIgnored();
});

const showCommand = vscode.commands.registerCommand(SHOW_COMMAND, async () => {
	await hideGitIgnored();
});


export async function activate(context: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);

	fileWatcher.onDidCreate(async () => enableCommand());
	fileWatcher.onDidDelete(async () => enableCommand());
	enableCommand();

	(statusBarItem.command = HIDE_COMMAND),
		async () => {
			hideGitIgnored();
		};

	updateStatusBar(isGitIgnoredExcluded());


	context.subscriptions.push(statusBarItem);
	context.subscriptions.push(hideCommand);
	context.subscriptions.push(showCommand);
}

export function deactivate() {
	// No-op.
}
