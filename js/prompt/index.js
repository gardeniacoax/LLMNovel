import {
    ROLE_CARD_PROMPT,
    CHAPTER_ANALYSIS_PROMPT,
    PLOT_ANALYSIS_PROMPT,
    STYLE_ANALYSIS_PROMPT,
    CONTINUE_PROMPT,
    REWRITE_PROMPT,
    PROMPT_TEMPLATES,
    getTemplateById,
    getTemplatePrompt,
    getAllTemplates
} from './templates.js'

import { ROLE_ANALYSIS_PROMPT } from './role-templates.js'

import {
    ExtensionManager,
    EXTENSION_KEYS,
    EXTENSION_TYPES
} from './extension-manager.js'

import { PromptMerger } from './prompt-merger.js'

import {
    PromptBuilder,
    promptBuilder,
    DEFAULT_GLOBAL_PROMPT,
    CONFIG_KEYS
} from './prompt-builder.js'

export {
    ROLE_CARD_PROMPT,
    ROLE_ANALYSIS_PROMPT,
    CHAPTER_ANALYSIS_PROMPT,
    PLOT_ANALYSIS_PROMPT,
    STYLE_ANALYSIS_PROMPT,
    CONTINUE_PROMPT,
    REWRITE_PROMPT,
    PROMPT_TEMPLATES,
    getTemplateById,
    getTemplatePrompt,
    getAllTemplates,
    ExtensionManager,
    EXTENSION_KEYS,
    EXTENSION_TYPES,
    PromptMerger,
    PromptBuilder,
    promptBuilder,
    DEFAULT_GLOBAL_PROMPT,
    CONFIG_KEYS
}
