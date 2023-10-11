import { App, Editor, FileSystemAdapter, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting,Vault,request } from 'obsidian';
import { exec,spawn,ChildProcess  } from 'child_process';
// import * as process from 'process';


import { stat } from 'fs';
// import { spawn } from 'child_process';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	api_url : string;
	port: string;
	text_api : string;
	text_model : string;
	image_api : string;
	image_generator: string;
	image_model : string;
	image_path : string;
	negative_prompt: string;
	context: boolean;
	generate_tags: boolean;
	keepOriginal: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	api_url : 'http://127.0.0.1',
	port: '5000',
	text_api:'api/text',
	text_model : 'gpt3',
	image_api:'api/image',
	image_generator : 'prodia',
	image_model: 'dreamshaper_8',
	image_path: 'gpt',
	negative_prompt: '(nsfw:1.5),verybadimagenegative_v1.3, ng_deepnegative_v1_75t, (ugly face:0.5),cross-eyed,sketches, (worst quality:2), (low quality:2.1), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, bad anatomy, DeepNegative, facing away, tilted head, {Multiple people}, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worstquality, low quality, normal quality, jpegartifacts, signature, watermark, username, blurry, bad feet, cropped, poorly drawn hands, poorly drawn face, mutation, deformed, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, extra fingers, fewer digits, extra limbs, extra arms,extra legs, malformed limbs, fused fingers, too many fingers, long neck, cross-eyed,mutated hands, polar lowres, bad body, bad proportions, gross proportions, text, error, missing fingers, missing arms, missing legs, extra digit, extra arms, extra leg, extra foot, repeating hair',
	context: true,
	generate_tags: true,
	keepOriginal: true,
}

// const default_setings = {
// 	api : 'http://127.0.0.1',
// 	port: '5000',
// 	chat_model: 'gpt3',
// 	photo_model: 'prodia',
// }
// const chat_models = ['gpt3','gpt4',]
// const photo_models = ['prodia']
let appProcess: ChildProcess | null = null;


function startApp(basepath:string,ports:string): void {
  // Replace './app' with the actual path to your app
//   settings: MyPluginSettings;

  
  appProcess = spawn(`${basepath}/.obsidian/plugins/obsidian/pythons/venv/bin/python`,[`${basepath}/.obsidian/plugins/obsidian/pythons/app.py`,ports]);
//   appProcess = spawn('./pythons/app', [ports]);
  console.log('survivd')
  // Optional: Listen for the app's output
  appProcess.stdout.on('data', (data) => {
    console.log(`App output: ${data}`);
  });
  
  // Optional: Listen for any errors
  appProcess.on('error', (err) => {
    console.error(`Failed to start app: ${err.message}`);
  });
  
  // Optional: Listen for the app's exit event
  appProcess.on('exit', (code, signal) => {
    if (signal === 'SIGINT') {
      console.log('App stopped by user');
    } else {
      console.log(`App exited with code ${code}`);
    }
  });
}
function stopApp(): void {
	if (appProcess) {
	  appProcess.kill();
	  appProcess = null;
	} else {
	  console.log('App is not running');
	}
  }

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	// async runPythonScript() {
	// 	exec('~/docs/course-maker/venv/bin/python3 ~/docs/course-maker/app.py', (error, stdout, stderr) => {
	// 	  if (error) {
	// 		console.error(`Error: ${error.message}`);
	// 		return;
	// 	  }
	// 	  if (stderr) {
	// 		console.error(`Stderr: ${stderr}`);
	// 		return;
	// 	  }
	// 	  console.log(`Output: ${stdout}`);
	// 	});
	//   }
	
	async callTextAPI(
		prompt: string,
		model : string
	) {
		// await this.loadSettings();
		console.log('here');
		console.log(`${this.settings.api_url}:${this.settings.port}/${this.settings.text_api}`)
		const response = await request({
			url: `${this.settings.api_url}:${this.settings.port}/${this.settings.text_api}`,
			method: "POST",
			// headers: {
			// 	Authorization: `Bearer ${this.settings.apiKey}`,
				// "Content-Type": "application/json",
			// },
			contentType: "application/json",
			body: JSON.stringify({
				prompt: prompt,
				model :model,

			// 	max_tokens: max_tokens,
			// 	temperature: temperature,
			// 	best_of: best_of,
			}),
		});
		console.log('sent')

		const responseJSON = JSON.parse(response);
		// console.log(responseJSON);
		return responseJSON['response'];
		// return responseJSON.choices[0].text;
	}
	async callImageAPI(
		prompt: string,
		generator : string,
		model : string,
		negative_prompt: string,
		path : string,
	) {
		// await this.loadSettings();
		const response = await request({
			url: `${this.settings.api_url}:${this.settings.port}/${this.settings.image_api}`,
			method: "POST",
			contentType: "application/json",
			body: JSON.stringify({
				prompt: prompt,
				generator :generator,
				model :model,
				negative_prompt :negative_prompt,
				path : path,
				basepath: this.app.vault.adapter.basePath
			}),
		});

		const responseJSON = JSON.parse(response);
		return responseJSON['response'];
	}
	
	async onload() {
		await this.loadSettings();
		let basepath = this.app.vault.adapter.basePath
		// this.runPythonScript();
		// const pythonProcess = spawn('python', ['pythons/app.py']);
		// const pythonProcess = spawn('bash', ['pythons/build/app.py']);
		// console.log(`./pythons/app ${this.settings.port}`);
		// const appProcess = spawn(`./pythons/app`, [this.settings.port]);
		startApp(basepath,this.settings.port);
		
		// const appProcess = spawn('bash', [`pythons/app.py ${this.settings.port}`]);
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice, i just changed it. again');
		});
		
	
		

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		const statusBar = this.addStatusBarItem();
		statusBar.setText('Loaded')
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
		this.addCommand({
			id: 'Generate text',
			name: 'Generate text',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const text = editor.getLine(editor.getCursor().line);
				// console.log(text)
				const prompt = '** VERY IMPORTANT DO NOT FORGET THIS FOR THE OUTPUT ** {"format": "markdown"}\n\n'+text
				statusBar.setText("Generating...");
				const response = await this.callTextAPI(prompt, this.settings.text_model);
				let tags = "";

				console.log(prompt);

				if (this.settings.generate_tags) {
					const tagsPrompt = `Summarize this text into a space separated list of tags.Using the following format for the tags: #tag1 #tag2 etc.\n\nText:\n${response}\n\nTags:\n`;
					tags = await this.callTextAPI(tagsPrompt, this.settings.text_model);
				}
				editor.replaceSelection(
					`\n${response}\t${tags}\n`,
					// editor.getCursor()
				);
				statusBar.setText("Loaded");
			},
		});

		this.addCommand({
			id: "Summarize Text",
			name: "Summarize Text",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const text = editor.getSelection();
				// const loading = this.addStatusBarItem();
				statusBar.setText("Summarizing...");

				const summaryPrompt = `Do not state you are summarizing the text.Summarize this text into one tweet.\n\nText:\n${text}\n\nSummary:\n`;
				const summary = await this.callTextAPI(summaryPrompt, this.settings.text_model);
				let tags = "";

				console.log(this.settings.context);

				if (this.settings.generate_tags) {
					const tagsPrompt = `Summarize this text into a comma separated list of tags.\n\nText:\n${text}\n\nTags:\n`;
					tags = await this.callTextAPI(tagsPrompt, this.settings.text_model);
				}
				const titlePrompt = `Suggest a one line title for the following text.\n\nText:\n${text}\n\nTitle:\n`;
				const title = await this.callTextAPI(titlePrompt,this.settings.text_model);
				let summary2 = summary + title;
				
				editor.replaceSelection(
					`# ${title.trim()}${
						this.settings.context ? `\n\n## Tags:\n${tags}` : ""
					}\n\n## Summary:\n${summary}\n\n${
						this.settings.keepOriginal
							? `## Original Text:\n\n${editor.getSelection()}`
							: ""
					}`
				);
				statusBar.setText("Loaded");
			},
		});

// outline > complete sentences
		this.addCommand({
			id: "outline-to-complete-sentences",
			name: "Outline to Complete Sentences",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const text = editor.getSelection();
				const sentencesPrompt = `Convert this bulleted outline into complete sentence English (maintain the voice and styling (use bold, links, headers and italics Markdown where appropriate)). Each top level bullet is a new paragraph/section. Sub bullets go within the same paragraph. Convert shorthand words into full words.\n\nOutline:\n${text}\n\nComplete Sentences Format:\n`;
				// const loading = this.addStatusBarItem();
				statusBar.setText("Loading...");
				const sentences = await this.callTextAPI(
					sentencesPrompt,
					this.settings.text_model,
				);
				editor.replaceSelection(
					`${
						this.settings.keepOriginal
							? `${editor.getSelection()}`
							: ""
					}\n\n${sentences}`
				);
				statusBar.setText("Loaded");
			},
		});

		this.addCommand({
			id: "Generate image",
			name: "Generate image",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				// const text = editor.getSelection();
				const text = editor.getLine(editor.getCursor().line);
				statusBar.setText("Loading...");
				const sentences = await this.callImageAPI(
					text,
					this.settings.image_generator,
					this.settings.image_model,
					this.settings.negative_prompt,
					this.settings.image_path,
				);
				
				editor.replaceSelection(
					`${
						this.settings.keepOriginal
							? `${editor.getSelection()}`
							: ""
					}\n${sentences}\n`
				);
				statusBar.setText("Loaded");
			},
		});

		this.addCommand({
			id: "Generate prompt and image",
			name: "Generate prompt and image",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				let context = 'I want you to act as a Stable Diffusion Art Prompt Generator. The formula for a prompt is made of parts, the parts are indicated by brackets. The [Subject] is the person place or thing the image is focused on. [Emotions] is the emotional look the subject or scene might have. [Verb] is What the subject is doing, such as standing, jumping, working and other varied that match the subject. [Adjectives] like beautiful, rendered, realistic, tiny, colorful and other varied that match the subject. The [Environment] in which the subject is in, [Lighting] of the scene like moody, ambient, sunny, foggy and others that match the Environment and compliment the subject. [Photography type] like Polaroid, long exposure, monochrome, GoPro, fisheye, bokeh and others. And [Quality] like High definition, 4K, 8K, 64K UHD, SDR and other. The subject and environment should match and have the most emphasis.\nIt is ok to omit one of the other formula parts. I will give you a [Subject], you will respond with a full prompt. Present the result as one full sentence, no line breaks, no delimiters, and keep it as concise as possible while still conveying a full scene.\nTo ensure the exclusion of undesirable characteristics in the generated art, it is recommended to use an appropriate negative prompt, such as:\ncodeugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face\nHere are samples of how it should be output\n"Beautiful woman, contemplative and reflective, sitting on a bench, cozy sweater, autumn park with colorful leaves, soft overcast light, muted color photography style, 4K quality." \n"Full-body portrayal of a jubilant Ana de Armas, detailed anime realism, trending on Pixiv, minute detailing, sharp and clean lines, award-winning illustration, 4K resolution, inspired by Eugene de Blaas and Ross Tran`s artistry, vibrant color usage, intricately detailed."\n"Full-body depiction of Ana de Armas, Alberto Seveso and Geo2099 style, an intricately detailed and hyper-realistic image in Lisa Frank style, trending on Artstation, butterflies and florals, sharp focus akin to a studio photograph, intricate details, praised by artists Tvera, Wlop, and Artgerm."'
				// const text = editor.getSelection();
				const text = editor.getLine(editor.getCursor().line);
				statusBar.setText("Loading...");
				const prompt_new = await this.callTextAPI(
					context+text,
					this.settings.text_model,
				);
				statusBar.setText("image gen...");
				
				const image_output_0 = await this.callImageAPI(
					text,
					this.settings.image_generator,
					this.settings.image_model,
					this.settings.negative_prompt,
					this.settings.image_path,
				);

				const image_output = await this.callImageAPI(
					prompt_new,
					this.settings.image_generator,
					this.settings.image_model,
					this.settings.negative_prompt,
					this.settings.image_path,
				);
				editor.replaceSelection(
					`${
						this.settings.keepOriginal
							? `${editor.getSelection()}`
							: ""
					}\n${image_output_0}\n**new Prompt**\n${prompt_new}\n${image_output}\n`
				);
				statusBar.setText("Loaded");
			},
		});
		

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		stopApp();
		// appProcess.kill();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		new Setting(containerEl)
			.setName("api url")
			.setDesc("url for the API")
			.addText((text) =>
				text
					.setPlaceholder("some-api-url")
					.setValue(this.plugin.settings.api_url)
					.onChange(async (value) => {
						this.plugin.settings.api_url = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("api port")
			.setDesc("port for the API")
			.addText((text) =>
				text
					.setPlaceholder(this.plugin.settings.port)
					.setValue(this.plugin.settings.port)
					.onChange(async (value) => {
						this.plugin.settings.port = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName('Context')
			.setDesc('Whether the prompt should take in the note as context.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.context)
					.onChange(async (value) => {
						this.plugin.settings.context = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName('Genrate tags')
			.setDesc('Whether the prompt should generate tags after the prompt.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.generate_tags)
					.onChange(async (value) => {
						this.plugin.settings.generate_tags = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Text model")
			.setDesc("Choose the text model to use for generation")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("gpt3", "gpt3")
					.addOption("gpt4", "gpt4")
					.addOption("alpaca", "alpaca_7b")
					.addOption("falcon", "falcon_40b")
					
					.setValue(this.plugin.settings.text_model)
					.onChange(async (value) => {
						this.plugin.settings.text_model = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Keep Original Text (Summarizer)")
			.setDesc("Keep the original text in the summary")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.keepOriginal)
					.onChange(async (value) => {
						console.log("Keep Original: " + value);
						this.plugin.settings.keepOriginal = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Image service")
			.setDesc("Choose the image service to use for generation")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("prodia", "prodia")
					.addOption("pollinations", "pollinations")
					
					.setValue(this.plugin.settings.image_generator)
					.onChange(async (value) => {
						console.log("Engine: " + value);
						this.plugin.settings.image_generator = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Image model")
			.setDesc("Choose the image model to use for generation")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("dreamshaper_6BakedVae.safetensors [114c8abb]", "Dreamshaper 6")
					.addOption("dreamshaper_8.safetensors [9d40847d]", "Dreamshaper 8")
					.addOption("childrensStories_v1ToonAnime.safetensors [2ec7b88b]",'Childrens Stories v1 ToonAnime')
					.addOption("cyberrealistic_v33.safetensors [82b0d085]","Cyberrealistic v33")
					.addOption("absolutereality_v181.safetensors [3d9d4d2b]","Absolute Reality v181")
					.addOption("anythingV5_PrtRE.safetensors [893e49b9]","Anything V5")
					.addOption("Realistic_Vision_V5.0.safetensors [614d1063]","Realistic Vision V5.0")
					.addOption("v1-5-pruned-emaonly.safetensors [d7049739]","SD v1-5")
					.addOption("neverendingDream_v122.safetensors [f964ceeb]","Neverending Dream")
					.addOption("lofi_v4.safetensors [ccc204d6]","lofi V4")
					.setValue(this.plugin.settings.image_model)
					.onChange(async (value) => {
						console.log("Engine: " + value);
						this.plugin.settings.image_model = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Image save path")
			.setDesc("Path to save the image")
			.addText((text) =>
				text
					.setPlaceholder(this.plugin.settings.image_path)
					.setValue(this.plugin.settings.image_path)
					.onChange(async (value) => {
						this.plugin.settings.image_path = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('negative prompt (image generation)')
			.setDesc('negative prompts for the image generation.')
			.addTextArea(text => text
				// .setPlaceholder('')
				.setValue(this.plugin.settings.negative_prompt)
				.onChange(async (value) => {
					this.plugin.settings.negative_prompt = value;
					await this.plugin.saveSettings();
				}));		
	}
	
}
