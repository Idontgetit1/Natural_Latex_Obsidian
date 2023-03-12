import { App, MarkdownView, Modal, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";

interface NaturalLatexSettings {
	openaiApiKey: string;
}

const DEFAULT_SETTINGS: NaturalLatexSettings = {
	openaiApiKey: "",
}


export default class NaturalLatex extends Plugin {
	settings: NaturalLatexSettings;

	async onload() {
		console.log("loading plugin: Natural Latex");

		await this.loadSettings();
		this.addCommand({
			id: "natural-latex",
			name: "Natural Latex",
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

				if (markdownView) {
					if (!checking) {
						new NaturalLatexModal(this.app, markdownView, this.settings).open();
					}

					return true;
				}
			}
		});


		this.addSettingTab(new NaturalLatexSettingsTab(this.app, this));
	}

	onunload() {
		console.log("unloading plugin: Natural Latex");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// modal 
class NaturalLatexModal extends Modal {
	markdownView: MarkdownView;
	openai: string;
	constructor(app: App, markdownView: MarkdownView, settings: NaturalLatexSettings) {
		super(app);
		this.markdownView = markdownView;
		this.openai = settings.openaiApiKey;
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Natural Latex');

		// spacer
		contentEl.createEl('div', {
			cls: 'mod-spacer',
		});

		let inputEl = contentEl.createEl('textarea', {
			cls: 'mod-input',
			attr: {
				'rows': '10',
				'cols': '50',
			}
		});

		// spacer
		contentEl.createEl('div', {
			cls: 'mod-spacer',
		});

		let buttonEl = contentEl.createEl('button', {
			text: 'Generate Latex',
			cls: 'mod-cta',
		});

		buttonEl.addEventListener('click', async () => {

			const requestOptions = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.openai,
				},
				body: JSON.stringify({
					"model": "gpt-3.5-turbo",
					"messages": [
						{ role: "system", content: "You are a large language model that translates natural language to LaTeX code. Answer as concisely as possible."},
						{ role: "system", content: "The answer should only contain the Latex code in this format: $<code>$."},
						{ role: "user", content: "Translate the following to LaTeX code: sum from 0 to k of x squared"},
						{ role: "assistant", content: "$\\sum\\limits_{i=0}^{k} x^2$" },
						{ role: "user", content: "Translate the following to LaTeX code: " + inputEl.value },
					],
					"temperature": 0.7,
				})
			};

			fetch('https://api.openai.com/v1/chat/completions', requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data);
					this.markdownView.editor.replaceSelection(data.choices[0].message.content);
				}).catch(error => {
					console.log(error);
				});

			this.close();
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}


class NaturalLatexSettingsTab extends PluginSettingTab {
	plugin: NaturalLatex;

	constructor(app: App, plugin: NaturalLatex) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Natural Latex.'});

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Your OpenAI API key.')
			.addText(text => text
				.setPlaceholder('OpenAI API Key')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}